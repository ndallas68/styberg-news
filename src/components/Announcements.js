/**
 * Announcements Component
 *
 * Displays company announcements from the \\Users\\Public\\STYBERGNEWS\\Announcements directory, rotating through them automatically.
 *
 * Key Features:
 * - **Data Fetching:**
 *   - Retrieves announcements from the main process via IPC (`window.electronAPI.getAnnouncements()`).
 *   - Refreshes announcements every minute.
 * - **Announcement Rotation:**
 *   - Automatically cycles through announcements every 30 seconds.
 * - **Content Display:**
 *   - Shows the content of the current announcement in a styled container.
 *   - Includes a header with the "Announcements" title.
 * - **UI Elements:**
 *   - Displays indicators at the bottom representing the number of announcements.
 *
 * Notes for Developers:
 * - **State Management:**
 *   - Manages announcements and current index using React's `useState`.
 * - **Effect Hooks:**
 *   - Uses `useEffect` for data fetching and setting up intervals.
 * - **Customization:**
 *   - Adjust rotation and refresh intervals (`carouselInterval` and `refreshInterval`) as needed.
 */


import React, { useState, useEffect, useRef } from 'react';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const carouselInterval = useRef(null);

  const fetchAnnouncements = async () => {
    try {
      const data = await window.electronAPI.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const refreshInterval = setInterval(() => {
      fetchAnnouncements();
    }, 60000);
    return () => { clearInterval(refreshInterval); };
  }, []);

  // Carousel logic
  useEffect(() => {
    if (announcements.length > 0) {
      carouselInterval.current = setInterval(() => {
        setCurrentAnnouncementIndex((prevIndex) =>
          prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
        );
      }, 30000);
    }
    return () => clearInterval(carouselInterval.current);
  }, [announcements]);

  return (
    <div className="relative flex flex-col w-1/3 shadow-lg overflow-hidden">
      <div className='flex p-2 pl-4 bg-white/20 bg-blur backdrop-blur-3xl mb-2'>
        <h1 className="font-extrabold text-4xl w-full text-white text-start ml-2 p-1">
          Announcements
        </h1>
      </div>
      {announcements.length > 0 ? (
        <div className="backdrop-blur-sm bg-white/5 h-full">
          <p className='flex p-10 m-10 justify-center items-center text-4xl text-wrap text-center'>
            {announcements[currentAnnouncementIndex].content}
          </p>
        </div>
      ) : (
        <div className='h-full flex items-center justify-center bg-white/5 backdrop-blur-sm'>
          <p className='text-gray-500'>
            No announcements today. Have a great day!
          </p>
        </div>
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-start mb-4 ml-4">
        {announcements.map((_, index) => (
          <div
            key={index}
            className={`w-6 h-2 mr-1 rounded ${
              index === currentAnnouncementIndex ? 'bg-white' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default Announcements;
