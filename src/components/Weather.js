/**
 * Weather Component
 *
 * Displays current weather conditions, an 8-hour precipitation forecast chart,
 * and a 4-day weather forecast with corresponding icons and temperatures.
 *
 * Key Features:
 * - **Data Fetching:**
 *   - Fetches real-time weather data from the main process using IPC calls.
 *   - In development mode, uses customizable mock data to facilitate testing without API calls.
 * - **3D Weather Scenes:**
 *   - Integrates Spline to render dynamic 3D scenes based on weather conditions and time of day.
 * - **Precipitation Chart:**
 *   - Uses Recharts to display the chance of precipitation over the next 8 hours.
 * - **Forecast Display:**
 *   - Shows weather conditions for the next four days with icons and temperature ranges.
 *
 * Notes:
 * - **Mock Data Usage:**
 *   - Enable or disable mock data with the `useMockData` flag.
 *   - Adjust `devMainWeather` to simulate different weather conditions during development.
 * - **Weather Condition Mapping:**
 *   - `weatherIconMapping` links weather conditions to icons from `react-icons`.
 *   - `splineScenes` maps weather condition codes to Spline scene URLs.
 * - **Time-Based Rendering:**
 *   - Calculates sunrise and sunset to determine if it's day or night for scene selection.
 * - **Data Processing:**
 *   - `processForecastData` organizes raw forecast data for display.
 * - ** API Limits **
 *   - One Call API allows for 1,000 calls per day.
 */

import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import Spline from '@splinetool/react-spline';
import {
  WiDaySunny,
  WiCloudy,
  WiRain,
  WiSnow,
  WiThunderstorm,
  WiFog,
} from 'react-icons/wi';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function Weather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);
  const [isDev, setIsDev] = useState(null);
  const useMockData = true;

  const fetchEnvironment = async () => {
    try {
      const getEnvironment = await window.electronAPI.fetchEnvironment();
      setIsDev(getEnvironment);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchEnvironment();
  }, []);

  const fetchWeather = async () => {
    if (isDev && useMockData) {
      const mockWeatherData = {
        current: {
          temp: 75,
          feels_like: 77,
          weather: [
            {
              id: 200,  // 200: thunderstorm, 300/500: rain, 600: snow, 800: clear, 801: partly cloudy, 804: overcast, 700: disasters
              main: 'thunderstorm',
              description: 'light thunderstorm',
              icon: '10d',
            },
          ],
          sunrise: Math.floor(Date.now() / 1000) - 3600 * 2,
          sunset: Math.floor(Date.now() / 1000) + 3600 * 6, 
        },
        hourly: [

          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 0,
            pop: 0.1, 
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 1,
            pop: 0.2, 
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 2,
            pop: 0.8,
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 3,
            pop: 0.9,
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 4,
            pop: 0.7,
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 5,
            pop: 0.5,
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 6,
            pop: 0.0,
          },
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 7,
            pop: 0.0,
          },
        ],
        daily: [
          {
            temp: {
              min: 65,
              max: 80,
            },
          },
        ],
      };
      const mockForecastData = {
        list: [
          // Each item represents a 3-hour forecast
          // Day 1 - Sunny
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 24 * 1,
            main: {
              temp: 78,
            },
            weather: [
              {
                main: 'Clear',
              },
            ],
          },
          // Day 2 - Cloudy
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 24 * 2,
            main: {
              temp: 75,
            },
            weather: [
              {
                main: 'Clouds',
              },
            ],
          },
          // Day 3 - Rainy
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 24 * 3,
            main: {
              temp: 70,
            },
            weather: [
              {
                main: 'Rain',
              },
            ],
          },
          // Day 4 - Sunny
          {
            dt: Math.floor(Date.now() / 1000) + 3600 * 24 * 4,
            main: {
              temp: 80,
            },
            weather: [
              {
                main: 'Clear',
              },
            ],
          },
        ],
      };
      const dailyForecast = processForecastData(mockForecastData);

      setWeather(mockWeatherData);
      setForecast(dailyForecast);
      console.log('mock weather data used');
    } else {
      console.log('using API weather data');
      try {
        const currentWeather = await window.electronAPI.fetchWeather();
        setWeather(currentWeather);

        const forecastWeather = await window.electronAPI.fetchForecast();
        const dailyForecast = processForecastData(forecastWeather);
        setForecast(dailyForecast);

      } catch (error) {
        console.error('Error fetching the weather data', error);
        setError('Failed to fetch weather data');
      }
    }
  }

  useEffect(() => {
    if (isDev !== null) {
      fetchWeather();

      const weatherUpdateInterval = setInterval(() => {
        fetchWeather();
      }, 60 * 1000 * 10);

      return () => clearInterval(weatherUpdateInterval);
    }
  }, [isDev]);

  // Process forecast data
  const processForecastData = (data) => {
    const groupedData = {};

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateString = date.toISOString().split('T')[0];
      if (!groupedData[dateString]) {
        groupedData[dateString] = [];
      }
      groupedData[dateString].push(item);
    });

    // Get forecast data for the next 4 days
    const todayDateString = new Date().toISOString().split('T')[0];
    const dates = Object.keys(groupedData)
      .filter((date) => date >= todayDateString)
      .sort();

    const dailyData = dates.slice(0, 4).map((date) => {
      const dayData = groupedData[date];

      // Initialize min and max temperatures
      let minTemp = Infinity;
      let maxTemp = -Infinity;
      const conditionCounts = {};

      dayData.forEach((item) => {
        const temp = item.main.temp;
        if (temp < minTemp) minTemp = temp;
        if (temp > maxTemp) maxTemp = temp;

        const condition = item.weather[0].main;
        if (conditionCounts[condition]) {
          conditionCounts[condition]++;
        } else {
          conditionCounts[condition] = 1;
        }
      });

      // Determine the most common weather condition
      let mostCommonCondition = null;
      let maxCount = 0;
      for (const condition in conditionCounts) {
        if (conditionCounts[condition] > maxCount) {
          maxCount = conditionCounts[condition];
          mostCommonCondition = condition;
        }
      }

      return {
        date: date,
        temp_min: minTemp,
        temp_max: maxTemp,
        condition: mostCommonCondition,
      };
    });

    return dailyData;
  };

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!weather || forecast.length === 0)
    return <div className="text-white">Loading weather...</div>;

  // OneCall 3.0 API data
  const {
    current: { temp, feels_like, weather: currentWeatherArray },
    hourly,
    daily,
  } = weather;
  const { id: weatherId, description } = currentWeatherArray[0];
  const todayForecast = daily[0];
  const { min: temp_min, max: temp_max } = todayForecast.temp;

  // Extract rain data for the next 8 hours
  const next8Hours = hourly.slice(0, 8).map((hourData) => {
    const date = new Date(hourData.dt * 1000);
    let hour = date.getHours();
    let period = "AM";

    if (hour > 12) {
      hour = hour - 12;
      period = "PM";
    } else if (hour === 12) {
      period = "PM";
    } else if (hour < 1) {
      hour = 1;
    }

    return {
      time: `${hour} ${period}`,
      pop: (hourData.pop * 100).toFixed(0),
      period: `${period}`,
    };
  });

  const weatherIconMapping = {
    Clear: <WiDaySunny size={48} />,
    Clouds: <WiCloudy size={48} />,
    Rain: <WiRain size={48} />,
    Drizzle: <WiRain size={48} />,
    Thunderstorm: <WiThunderstorm size={48} />,
    Snow: <WiSnow size={48} />,
    Mist: <WiFog size={48} />,
    Smoke: <WiFog size={48} />,
    Haze: <WiFog size={48} />,
    Dust: <WiFog size={48} />,
    Fog: <WiFog size={48} />,
    Sand: <WiFog size={48} />,
    Ash: <WiFog size={48} />,
    Squall: <WiFog size={48} />,
    Tornado: <WiFog size={48} />,
  };

  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  const today = new Date();
  const dayNumber = today.getDate();
  const ordinalSuffix = getOrdinalSuffix(dayNumber);

  function formatCurrentDate() {
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const dayName = daysOfWeek[today.getDay()];
    const monthName = months[today.getMonth()];

    return `${dayName}, ${monthName} ${dayNumber}`;
  }

  const formattedDate = formatCurrentDate();

  // Spline weather scenes
  let splineScenes = null;
  let splineSceneUrl = null;

  const { sunrise, sunset } = weather.current;
  const utcTime = Math.floor(new Date().getTime() / 1000);

  if (utcTime >= sunrise && utcTime < sunset) {
    splineScenes = {
      200: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with light rain
      201: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with rain
      202: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with heavy rain
      210: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // light thunderstorm
      211: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm 
      212: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // heavy thunderstorm 
      221: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // ragged thunderstorm 
      230: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with light drizzle 
      231: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with drizzle
      232: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with heavy drizzle

      300: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // light intensity drizzle
      301: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // drizzle
      302: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // heavy intensity drizzle
      310: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // light intensity drizzle rain
      311: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // drizzle rain
      312: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // heavy intensity drizzle rain
      313: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // shower rain and drizzle
      314: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // heavy shower rain and drizzle
      321: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // shower drizzle

      500: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Light Rain
      501: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Moderate Rain
      502: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Heavy intensity rain
      503: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Very heavy rain
      504: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Extreme rain
      511: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Freezing rain (x)
      520: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Light intensity shower rain 
      521: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Shower rain
      522: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // heavy intensity shower rain
      531: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // ragged shower rain
      
      600: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Light snow
      601: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Snow
      602: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Heavy snow
      611: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Sleet
      612: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // light shower sleet
      613: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // shower sleet
      615: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // light rain and snow
      616: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // rain and snow
      620: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // light shower snow
      621: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // shower snow
      622: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // heavy shower snow

      800: 'https://prod.spline.design/xkvpDnlvZzRdSQNn/scene.splinecode', // Clear
      
      701: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Mist
      711: '', // Smoke
      721: '', // Haze
      731: '', // Dust (sand/dust whirls)
      741: '', // Fog
      751: '', // Sand
      761: '', // Dust (dust)
      762: '', // volcanic ash
      771: '', // squalls
      781: '', // tornado

      801: 'https://prod.spline.design/JS3HK7e12qyvx4De/scene.splinecode', // Few Clouds
      802: 'https://prod.spline.design/JS3HK7e12qyvx4De/scene.splinecode', // Scattered Clouds
      803: 'https://prod.spline.design/JS3HK7e12qyvx4De/scene.splinecode', // Broken Clouds
      804: 'https://prod.spline.design/f4Qkqev0L-eCm-pA/scene.splinecode', // Overcast Clouds
    }

    splineSceneUrl = splineScenes[weatherId] || 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode';

  } else if (sunrise >= utcTime && sunset <= utcTime) {
    splineScenes = {
      200: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with light rain
      201: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with rain
      202: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with heavy rain
      210: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // light thunderstorm
      211: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm 
      212: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // heavy thunderstorm 
      221: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // ragged thunderstorm 
      230: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with light drizzle 
      231: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with drizzle
      232: 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode', // thunderstorm with heavy drizzle

      300: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // light intensity drizzle
      301: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // drizzle
      302: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // heavy intensity drizzle
      310: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // light intensity drizzle rain
      311: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // drizzle rain
      312: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // heavy intensity drizzle rain
      313: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // shower rain and drizzle
      314: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // heavy shower rain and drizzle
      321: 'https://prod.spline.design/DdRBFtXUE86cx4jm/scene.splinecode', // shower drizzle

      500: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Light Rain
      501: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Moderate Rain
      502: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Heavy intensity rain
      503: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Very heavy rain
      504: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Extreme rain
      511: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Freezing rain (x)
      520: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Light intensity shower rain 
      521: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Shower rain
      522: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // heavy intensity shower rain
      531: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // ragged shower rain
      
      600: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Light snow
      601: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Snow
      602: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Heavy snow
      611: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // Sleet
      612: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // light shower sleet
      613: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // shower sleet
      615: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // light rain and snow
      616: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // rain and snow
      620: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // light shower snow
      621: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // shower snow
      622: 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode', // heavy shower snow

      800: 'https://prod.spline.design/z8W5wcwZzUzjjLJi/scene.splinecode', // Clear
      
      701: 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode', // Mist
      711: '', // Smoke
      721: '', // Haze
      731: '', // Dust (sand/dust whirls)
      741: '', // Fog
      751: '', // Sand
      761: '', // Dust (dust)
      762: '', // volcanic ash
      771: '', // squalls
      781: '', // tornado

      801: 'https://prod.spline.design/z8W5wcwZzUzjjLJi/scene.splinecode', // Few Clouds
      802: 'https://prod.spline.design/z8W5wcwZzUzjjLJi/scene.splinecode', // Scattered Clouds
      803: 'https://prod.spline.design/z8W5wcwZzUzjjLJi/scene.splinecode', // Broken Clouds
      804: 'https://prod.spline.design/f4Qkqev0L-eCm-pA/scene.splinecode', // Overcast Clouds
    }

    splineSceneUrl = splineScenes[weatherId] || 'https://prod.spline.design/f4Qkqev0L-eCm-pA/scene.splinecode';

  } else {
    //splineSceneUrl = 'https://prod.spline.design/AC2lpPCp12jHnalJ/scene.splinecode' // rain
    //splineSceneUrl = 'https://prod.spline.design/7lS05oiXnQySeZkS/scene.splinecode' // lightning
    //splineSceneUrl = 'https://prod.spline.design/Dp9BU2YzDb3596Wa/scene.splinecode' // snow
    //splineSceneUrl = 'https://prod.spline.design/xkvpDnlvZzRdSQNn/scene.splinecode' // clear
    //splineSceneUrl = 'https://prod.spline.design/JS3HK7e12qyvx4De/scene.splinecode' // few clouds
    splineSceneUrl = 'https://prod.spline.design/f4Qkqev0L-eCm-pA/scene.splinecode' // overcast
    //splineSceneUrl = 'https://prod.spline.design/z8W5wcwZzUzjjLJi/scene.splinecode' // moon
  }

  return (
    <div className="absolute top-4 right-10 flex flex-col mr-3 z-0 w-[30vw] justify-between h-[58vh]">
      <div className="flex justify-between pt-2 h-[60%]">

        {/* Left Header */}
        <div className="relative flex flex-col justify-between">
          <div>
            <p className="font-semibold text-xl">{description}</p>
            <hr className="rounded-xl border border-white/30 mt-1 w-[50%]" />
            <p className="text-md text-white font-semibold mb-">
              H: {temp_max.toFixed(0)}° | L: {temp_min.toFixed(0)}°
            </p>
          </div>
          <Spline
            scene={splineSceneUrl}
            className=""
          />
        </div>

        {/* Right Header */}
        <div className="flex flex-col mr-4 text-right w-[50%] space-y-14">
          {/* Current Date */}
          <div>
            <span className="text-lg font-semibold">{formattedDate}</span>
            <sup>{ordinalSuffix}</sup>
            <hr className="rounded-xl border border-white/30 mt-1" />
          </div>
          {/* Temp */}
          <p className="text-7xl font-bold">{temp.toFixed(0)}°F</p>
          {/* Additional Info */}
          <div className="self-end mb-10">
            <p className="text-sm italic">Feels like: {feels_like.toFixed(0)}°F</p>
          </div>
        </div>
      </div>

      {/* Chance of Precipitation Chart */}
      <div className="relative -translate-x-2">
        <h1 className="absolute -top-10 left-2 left-[50%]x -translate-x-[50%]x text-xl font-semibold text-end text-white/40">Chance of Precipitation</h1>
        <div className='w-full h-[12vh] pr-5'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={next8Hours}>
              <XAxis dataKey='time' tick={{ fill: 'white' }} className='text-sm'/>
              <YAxis
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'white'}}
                ticks={[50, 100]}
                className='text-sm'
              />
              <Tooltip
                formatter={(value) => `${value}%`}
                labelStyle={{ color: 'Black' }}
              />
              <Area dataKey="pop" fill="#4682B4" stroke='#4682B4' type='monotone'/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast for next 4 days */}
      <div className="mt-5">
        <hr className="mb-2 border border-white/30" />
        <div className="flex justify-around">
        {forecast.map((day, index) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', {
            weekday: 'short',
          });
          const tempMin = day.temp_min.toFixed(0);
          const tempMax = day.temp_max.toFixed(0);
          const condition = day.condition;
          const Icon = weatherIconMapping[condition] || <WiFog size={48} />;
          return (
            <div key={index} className="flex flex-col items-center">
              <p className="text-white">{dayName}</p>
              {Icon}
              <p className="text-white">
                {tempMax}°F / {tempMin}°F
              </p>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Weather;