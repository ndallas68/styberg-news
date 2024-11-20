/**
* ##################
* #### Overview ####
* ##################
* 
* The preload.js script runs in the renderer process before any web content is loaded.
* It serves as a bridge between the main process and the renderer process, exposing a 
* controlled set of APIs that the renderer can use to communicate securely 
* with the main process.
* 
* ##################
* #### Function ####
* ##################
* 
* a) Exposing Secure APIs
*   - 'contextBridge' exposes safe and limited APIs to the renderer process
*   - Prevents direct access to Node.js APIs
* 
* b) IPC Communication
*   - Facilitates communication between renderer and main processes using 'ipcRenderer'
* 
* ######################
* #### Data Process ####
* ######################
* 
* IPC Communication:
* -------------------
* Renderer process initiates request -> preload handles request -> main process responds
* 
* Data Flow:
* ----------
* 1) User Action of Component Mounts:
*   - A React component needs data (e.g. weather information)
* 
* 2) Renderer Calls Exposed API
*   - Calls 'window.electronAPI.fetchWeather()'
* 
* 3) Preload Script Sends IPC Message:
*   - 'ipcRenderer.invoke('fetch-weather')'
* 
* 4) Main Process Handles Request:
*   - 'ipcMain.handle('fetch-weather', async () => { ... })'
*   - Makes API call using axios and returns data
* 
* 5) Data Returned to Renderer:
*   - Promise resolves in the renderer process with the fetched data
* 
* 6) React Component Updates State:
*   - Uses data to update component's state and re-render as necessary
*/

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  
  // Directory APIs
  getAnnouncements: () => ipcRenderer.invoke('get-announcements'),
  getNewsArticles: () => ipcRenderer.invoke('get-news-articles'),

  // HTTP APIs
  fetchWeather: () => ipcRenderer.invoke('fetch-weather'),
  fetchForecast: () => ipcRenderer.invoke('fetch-forecast'),
  fetchNews: () => ipcRenderer.invoke('fetch-news'),

  // Environment
  fetchEnvironment: () => ipcRenderer.invoke('fetch-environment'),
});
