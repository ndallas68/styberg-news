/**
 * Styberg News Component
 *
 * Displays company news articles from the \\Users\\Public\\STYBERGNEWS\\News directory, rotating through them automatically.
 *
 * Key Features:
 * - **Data Fetching:**
 *   - Retrieves news articles from the main process via IPC (`window.electronAPI.getNewsArticles()`).
 *   - Refreshes articles every minute. (issue with watcher functionality on network drives)
 * - **Article Rotation:**
 *   - Automatically cycles through articles every 30 seconds.
 *   - Allows manual navigation with previous and next buttons (visible in development mode).
 * - **Content Display:**
 *   - Dynamically handles articles that may contain images, text, or both.
 *   - Sanitizes HTML content using `DOMPurify` and renders it safely with `html-react-parser`.
 * - **UI Elements:**
 *   - Shows navigation indicators at the bottom representing the number of articles.
 *   - Displays the company logo and "Styberg News" title in the header.
 *
 * Notes for Developers:
 * - **Environment Detection:**
 *   - Determines if the app is in development mode to conditionally render navigation arrows.
 * - **State Management:**
 *   - Manages articles, current article index, and development mode state with React's `useState`.
 * - **Effect Hooks:**
 *   - Uses `useEffect` for initial data fetching, article refreshing, and setting up the carousel interval.
 * - **Sanitization:**
 *   - Sanitizes HTML content to prevent XSS attacks.
 * - **Customization:**
 *   - Adjust rotation and refresh intervals (`carouselInterval` and `refreshInterval`) as needed.
 */


import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import StybergLogo from '../images/styberg_logo_copy.jpg';

function StybergNews() {
  const [articles, setArticles] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const carouselInterval = useRef(null);
  const [isDev, setIsDev] = useState(null);

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
  
  const fetchArticles = async () => {
      try {
        const data = await window.electronAPI.getNewsArticles();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching news articles:', error);
      }
  };

  useEffect(() => {
    fetchArticles();
    const refreshInterval = setInterval(() => {
      fetchArticles();
    }, 60000);

    return () => { clearInterval(refreshInterval); }
  }, []);

  // Carousel functionality
  useEffect(() => {
    if (articles.length > 0) {
      carouselInterval.current = setInterval(() => {
        setCurrentArticleIndex((prevIndex) =>
          prevIndex === articles.length - 1 ? 0 : prevIndex + 1
        );
      }, 30000);
    }

    return () => clearInterval(carouselInterval.current);
  }, [articles]);

  // Navigation handlers
  const handlePrevArticle = () => {
    setCurrentArticleIndex((prevIndex) =>
      prevIndex === 0 ? articles.length - 1 : prevIndex - 1
    );
  };

  const handleNextArticle = () => {
    setCurrentArticleIndex((prevIndex) =>
      prevIndex === articles.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Determine what to render based on the presence of imagePath and description
  const currentArticle = articles[currentArticleIndex];
  const hasImage = currentArticle?.imagePath;
  const hasText = currentArticle?.description;

  return (
    <div className="relative h-[59vh] w-2/3 backdrop-blur-3xl shadow-lg overflow-hidden pr-3">
      {/* Heading */}
      <div className="flex pl-2 bg-white/20 bg-blur backdrop-blur-3xl mb-2">
        <img src={StybergLogo} alt="Styberg Logo" className="h-[5vh] w-[3vw] p-2" />
        <h1 className="font-extrabold text-4xl w-full text-white text-start p-2">
          Styberg News
        </h1>
      </div>

      {/* Navigation Arrows */}
      {articles.length > 1 && isDev && (
        <>
          <button
            onClick={handlePrevArticle}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaArrowLeft size={24} />
          </button>
          <button
            onClick={handleNextArticle}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaArrowRight size={24} />
          </button>
        </>
      )}

      {/* Article Display */}
      {articles.length > 0 ? (
        <div className="flex h-[100%] mt-2 bg-white/5">
          {hasImage && hasText ? (
            // Both Image and Text
            <div className='flex flex-col w-full'>
              <h1 className='font-bold text-6xl italic text-center mt-5'>{currentArticle.title}</h1>
              <hr className='w-[75%] self-center border border-white/30 my-5'/>
              <div className='flex mt-5'>
              
                {/* Image Side */}
                <div className="w-1/2 flex justify-center items-center rounded-xl">
                  <img
                    src={currentArticle.imagePath}
                    alt={currentArticle.title}
                    className="max-h-[40vh] max-w-[90%] rounded-xl object-contain"
                  />
                </div>

                {/* Text Side */}
                <div className="w-1/2 p-5">
                  <div className="prose prose-invert break-words overflow-y-auto article-content text-xl">
                    {parse(
                      DOMPurify.sanitize(currentArticle.description, {
                        ALLOWED_TAGS: [
                          'b',
                          'i',
                          'em',
                          'strong',
                          'a',
                          'p',
                          'ul',
                          'ol',
                          'li',
                          'br',
                          'u',
                          'strike',
                          'h1',
                          'h2',
                          'h3',
                          'h4',
                          'hr',
                        ],
                        ALLOWED_ATTR: ['href', 'target', 'rel'],
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : hasImage ? (
            // Only Image
            <div className="w-full max-h-[52vh] flex flex-col items-center justify-center">
              <img
                src={currentArticle.imagePath}
                alt={currentArticle.title}
                className="max-h-[100%] max-w-[100%] rounded-xl object-contain"
              />
            </div>
          ) : (
            // Only Text
            <div className="w-full p-4 flex flex-col">
              <h1 className="font-bold text-7xl italic text-center mt-2">
                {currentArticle.title}
              </h1>
              <hr className='w-[75%] self-center border border-white/30 mt-5'/>
              <div className="prose prose-invert break-words overflow-hidden article-content text-xl text-left p-4 translate-x-36">
                {parse(
                  DOMPurify.sanitize(currentArticle.description, {
                    ALLOWED_TAGS: [
                      'b',
                      'i',
                      'em',
                      'strong',
                      'a',
                      'p',
                      'ul',
                      'ol',
                      'li',
                      'br',
                      'u',
                      'strike',
                      'h1',
                      'h2',
                      'h3',
                      'h4',
                      'hr',
                    ],
                    ALLOWED_ATTR: ['href', 'target', 'rel'],
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-white/5">
          <p className="text-gray-500">No news today. Have a great day :)</p>
        </div>
      )}

      {/* Navigation Bars */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-start mb-4 ml-4">
        {articles.map((_, index) => (
          <div
            key={index}
            className={`w-6 h-2 mr-1 rounded ${
              index === currentArticleIndex ? 'bg-white' : 'bg-gray-500'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default StybergNews;
