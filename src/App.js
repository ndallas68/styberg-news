import React from 'react';
import './App.css';
import './index.css';
import Weather from './components/Weather';
import News from './components/WorldNews';
import StybergNews from './components/StybergNews';
import Spline from '@splinetool/react-spline';

function App() {
  return (
    <div className="min-h-screen bg-black text-white pt-5 px-10">
      {/* Blue Hues */}
      <div className='absolute w-[60vw] h-[80vh] bg-gradient-radial from-blue-600/30 to-black blur-3xl rounded-full top-0 left-0 -translate-y-96 -translate-x-96'/>
      <div className='absolute w-[80vw] h-[80vh] bg-gradient-radial from-blue-600/30 to-black blur-3xl rounded-full bottom-0 right-0 translate-y-64 translate-x-96'/>
      
      {/* Cog */}
      <div className='absolute z-0 w-[30vw] h-[55vh] -bottom-60 -right-72'>
        <Spline
          scene='https://prod.spline.design/PcTvXjX0OASTTpJE/scene.splinecode'
          className=""
        />
      </div>

      {/* Plate */}
      <div className='absolute z-0 w-[40vw] h-[90vh] -left-96'>
        <Spline
          scene='https://prod.spline.design/ntHaYlB77t7Py4zK/scene.splinecode'
          className=""
        />
      </div>
      <StybergNews />
      <Weather />
      <News />
    </div>
  );
}

export default App;
