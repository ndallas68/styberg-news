/** 
* ##################
* #### Overview ####
* ##################
* 
* Entry point of the application's main process. Responsible for creating application windows, 
* handling system events, and managing backend functionalities such as API requests that require access 
* to sensitive information (e.g., API keys).
* 
* ##################
* #### Function ####
* ##################
* 
* 1) Application Lifecycle Management
*   - Initializing the application
*   - Creating and managing browser windows
*   - Handling application events (e.g. ready, window-all-close, activate)
* 
* 2) Inter-Process Communication (IPC)
*   - Handling IPC calls from the renderer process
*   - Providing backend functionalities to the renderer process securely
* 
* 3) Backend Operations
*   - Performing API calls that require sensitive information
*   - Managing data that should not be exposed to the frontend (renderer process)
* 
* 
* #################
* #### Modules ####
* #################
* 
* Electron Modules:
* -----------------
* - app: Controls application lifecycle
* - BrowserWindow: Creates and manages application windows
* - ipcMain: Handles IPC communication from the renderer process
* 
* External Modules:
* -----------------
* - axios: HTTP requests to external APIs
* - path: Provides utilities for file and directory paths
* 
* Configuration Import:
* ---------------------
* API keys are imported from 'config.js', which are generated during
* the build process
* 
* 
*/

const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('node:path');
const fs = require('fs');
const mime = require('mime');
const axios = require('axios');
const isDev = !app.isPackaged;

if (isDev) {
  require('dotenv').config();
}
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const LATITUDE = '42.74908';
const LONGITUDE = '-87.80067';

// GPU flags to improve GPU compatibility
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('disable-software-rasterizer');

const announcementsDir = '\\\\sty-fs-1\\Users\\Public\\STYBERGNEWS\\Announcements';
const newsDir = '\\\\sty-fs-1\\Users\\Public\\STYBERGNEWS\\News';

let mainWindow;

function createWindow() {
  console.log('isDev: ' + isDev);
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.loadURL(
    isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname,'build','index.html')}`
  );

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();

    globalShortcut.register('Esc', () => {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        mainWindow.maximize();
      }
    });
  });

  mainWindow.on('blur', () => {
    globalShortcut.unregister('Esc');
  });

  mainWindow.on('focus', () => {
    globalShortcut.register('Esc', () => {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        mainWindow.maximize();
      }
    });
  });

  mainWindow.on('closed', () => {
    globalShortcut.unregisterAll();
  });

  if (!isDev) {
    mainWindow.removeMenu();
  }
}

app.whenReady().then(() => { 
  createWindow();

  app.on('will-quit', () => {
    mainWindow.unregisterAll();
  });
});

// Environment Boolean
ipcMain.handle('fetch-environment', async () => {
  return isDev;
})

// World News
ipcMain.handle('fetch-news', async () => {
  let newsDateRange = getDateRange(7);
  try {
    const response = await axios.get('https://api.mediastack.com/v1/news', {
      params: {
        country: 'us',
        categories: 'business,sports,science,health',
        access_key: NEWS_API_KEY,
        languages: 'en',
        limit: 10,
        date: newsDateRange,
        sort: 'popularity'
      },
    })
    const articles = response.data.data;

    const filteredArticles = articles.filter(
      (article) =>
        article.title &&
        article.image &&
        article.image.startsWith('http') &&
        article.description &&
        article.description.length <= 400
    );

    return filteredArticles;
  } catch (error) {
    throw error;
  }
});

function getDateRange(days) {
  const today = new Date().toISOString().slice(0,10);
  const range = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().slice(0,10);
  return (today + "," + range);
}


// Current Weather
ipcMain.handle('fetch-weather', async () => {
  try {
    const currentWeatherResponse = await axios.get(
      'https://api.openweathermap.org/data/3.0/onecall',
      {
        params: {
          lat: LATITUDE,
          lon: LONGITUDE,
          appid: WEATHER_API_KEY,
          units: 'imperial',
          exclude: 'minutely,alerts',
        },
      }
    );

    return currentWeatherResponse.data;
  } catch (error) {
    throw error;
  }
})

// Forecasted Weather
ipcMain.handle('fetch-forecast', async () => {
  try {
    const forecastResponse = await axios.get(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat: LATITUDE,
          lon: LONGITUDE,
          appid: WEATHER_API_KEY,
          units: 'imperial',
        },
      }
    );

    return forecastResponse.data;
  } catch (error) {
    throw error;
  }
})

// Styberg News
ipcMain.handle('get-news-articles', async () => {
  try {
    const files = await fs.promises.readdir(newsDir);
    const articles = [];

    const fileGroups = {};

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);

      if (!fileGroups[baseName]) {
        fileGroups[baseName] = {};
      }

      if (ext === '.txt') {
        fileGroups[baseName].textFile = file;
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
        fileGroups[baseName].imageFile = file;
      }
    }

    for (const baseName in fileGroups) {
      const group = fileGroups[baseName];
      let imageData;

      if (group.imageFile) {
        const imagePath = path.join(newsDir, group.imageFile);
        const imageBuffer = await fs.promises.readFile(imagePath);
        const mimeType = mime.lookup(group.imageFile) || 'application/octet-stream';
        imageData = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      }

      if (group.textFile && group.imageFile) {
        const textContent = await fs.promises.readFile(
          path.join(newsDir, group.textFile),
          'utf-8'
        );

        articles.push({
          type: 'article',
          title: baseName,
          description: textContent.trim(),
          imagePath: imageData,
        });

      } else if (group.textFile) {
        const textContent = await fs.promises.readFile(
          path.join(newsDir, group.textFile),
          'utf-8'
        );

        articles.push({
          type: 'article',
          title: baseName,
          description: textContent.trim(),
          imagePath: null,
        });
      } else if (group.imageFile) {
        articles.push({
          type: 'article',
          title: baseName,
          description: '',
          imagePath: imageData,
        });
      }
    } 
    return articles;
  } catch (error) {
    console.error('Error reading news articles:', error);
    return []; 
  }
});

// Announcements
ipcMain.handle('get-announcements', async () => {
  try {
    const files = await fs.promises.readdir(announcementsDir);
    const announcements = [];

    for (const file of files) {
      const filePath = path.join(announcementsDir, file);

      if (path.extname(file).toLowerCase() === '.txt') {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const trimmedContent = content.trim();

        if (trimmedContent.length > 0 && trimmedContent.length <= 100) {
          announcements.push({ content: trimmedContent });
        }
      }
    }

    return announcements;
  } catch (error) {
    console.error('Error reading announcements:', error);
    return [];
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});