/**
 * News Component
 *
 * Displays world news articles, rotating through them one at a time.
 *
 * Key Features:
 * - **Data Fetching:**
 *   - Fetches news articles from the main process using IPC calls (`window.electronAPI.fetchNews()`).
 *   - Updates news articles every 24 hours.
 * - **Article Rotation:**
 *   - Displays each article for 30 seconds before moving to the next.
 *   - Cycles back to the first article after the last one.
 * - **Error Handling:**
 *   - Shows an error message if news articles are unavailable.
 * - **UI Elements:**
 *   - Displays article title, description, and image.
 *   - Includes a header with a news icon and "World News" title.
 * - **Integration:**
 *   - Incorporates the `Announcements` component alongside the news section.
 *
 * Notes for Developers:
 * - **State Management:**
 *   - Manages articles, current article index, and error state using React's `useState`.
 * - **Effect Hooks:**
 *   - Uses `useEffect` for initial data fetching and setting up intervals for updates and rotation.
 * - **Customization:**
 *   - Adjust the rotation interval (`INTERVAL`) and news update frequency as needed.
 * - ** API Limits **
 *   - Media Stack API only allows for 100 calls PER MONTH. Update and run production data sparingly.
 */

import React, { useState, useEffect } from 'react';
import Announcements from './Announcements';
import { ImNewspaper } from "react-icons/im";
import PreviousMap from 'postcss/lib/previous-map';

function News() {
  const [articles, setArticles] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isDev, setIsDev] = useState(null);
  const useMockData = false;

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

  const fetchNews = async () => {

    // Format publish date
    const options = {
      weekday: 'long',     // e.g., 'Monday'
      year: 'numeric',     // e.g., '2024'
      month: 'long',       // e.g., 'August'
      day: 'numeric',      // e.g., '5'
      hour: 'numeric',     // e.g., '5' or '17' depending on locale
      minute: '2-digit',   // e.g., '47'
      second: '2-digit',   // e.g., '24'
      timeZone: 'UTC',     // Ensures the time is displayed in UTC
      timeZoneName: 'short' // e.g., 'UTC'
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);

    // Check environment and use of mock data
    if (isDev && useMockData) {
      console.log('mock news data used');
      const filteredArticles = [
        {
          title: 'Sample News Article 1',
          description: 'This is a sample description for article 1.',
          image: 'https://via.placeholder.com/150',
          url: 'https://example.com/article1',
          source: 'NBC.com',
          published_at: '2024-08-05T05:47:24+00:00'
        },
        {
          title: 'Sample News Article 2',
          description: 'This is a sample description for article 2.',
          image: 'https://via.placeholder.com/150',
          url: 'https://example.com/article2',
          source: 'NBC.com',
          published_at: '2024-08-05T05:47:24+00:00'
        },
      ]; 

      const articlesWithFormattedDate = filteredArticles.map(article => {
        const date = new Date(article.published_at);
        article.formattedDate = formatter.format(date);
        return article;
      });
  
      setArticles(articlesWithFormattedDate);
      setCurrentArticleIndex(0);
    } else {
      try {
        const filteredArticles = await window.electronAPI.fetchNews();

        const articlesWithFormattedDate = filteredArticles.map(article => {
          const date = new Date(article.published_at);
          article.formattedDate = formatter.format(date);
          return article;
        });
    
        setArticles(articlesWithFormattedDate);
        setCurrentArticleIndex(0);

        if (filteredArticles.length === 0) {
          setError('No news articles are currently available.');
        } else {
          setError(null);
        }
      } catch (error) {
        console.log('Error fetching the news data', error);
        setError('News articles are currently unavailable.');
      }
    }
  };

  useEffect(() => {
    if (isDev !== null) {
      fetchNews();
      const newsUpdateInterval = setInterval(() => {
        fetchNews();
      }, 60 * 1000 * 60 * 24);
      return () => clearInterval(newsUpdateInterval);
    }
  }, [isDev]);

  useEffect(() => {
    if (!articles.length) return;

    const INTERVAL = 30000;
    const intervalId = setInterval(() => {
      setCurrentArticleIndex((prevIndex) =>
        prevIndex === articles.length - 1 ? 0 : prevIndex + 1
      );
    }, INTERVAL);

    return () => clearInterval(intervalId);
  }, [articles]);

  const handleImageError = () => {
    setArticles((prevArticles) => {
      const updatedArticles = prevArticles.filter(
        (article, index) => index !== currentArticleIndex
      );
      return updatedArticles;
    });

    setCurrentArticleIndex((prevIndex) => {
      if (articles.length <= 1) {
        return 0;
      } else if (prevIndex >= articles.length - 1) {
        return 0;
      } else {
        return prevIndex;
      }
    });
  }

  let currentArticle = null;
  if (articles.length > 0) {
    currentArticle = articles[currentArticleIndex];
  }


  return (
    <>
      <div className="flex mt-8 h-[35vh] space-x-5">
        {/* News */}
        <div className="flex flex-col w-2/3 bg-blur backdrop-blur-md shadow-lg overflow-hidden">
          <div className="flex flex-col">
            {/* Article Text */}
            <div className='flex p-2 pl-4 bg-white/20 bg-blur backdrop-blur-3xl mb-2'>
              <ImNewspaper size={48} className='mr-4'/>
              <h1 className="font-extrabold text-4xl w-full text-start">World News</h1>
            </div>            
            <div className='flex bg-white/5'>
              <div className='w-1/2 p-5 px-10'>
                {error ? (
                  <p className='text-gray-500'>{error}</p>
                ) : !articles.length ? (
                  <p>loading news...</p>
                ) : (
                  <>
                    <h2 className="font-bold text-3xl">{currentArticle.title}</h2>
                    <p className="text-md text-gray-400 mt-4">{currentArticle.formattedDate}</p>
                    <p className="mt-2 text-lg">{currentArticle.description}</p>
                  </>
                )}
            </div>
            {/* Article Image */}
            <div className="w-1/2 h-[30vh] flex justify-center items-center rounded-xl">
              {error || !articles.length ? (
                <div className='h-[30vh]' />
              ) : (
                <img 
                  src={currentArticle.image} 
                  alt={currentArticle.title} 
                  onError={handleImageError}
                  className="max-h-[25vh] max-w-[90%] rounded-xl m-2" 
                />
              )}
            </div>
            </div>
          </div>
        </div>
        <Announcements />
      </div>
    </>
  );
}


export default News;
