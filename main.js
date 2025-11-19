// ==================== API KEYS ====================
// Use your simple, free API key here.
const OPENWEATHER_KEY = '';
const GNEWS_KEY = '';

// ==================== DOM ELEMENTS ====================
// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');

// === NEW: Unit Toggle ===
const unitsToggle = document.getElementById('units-toggle');

// Mobile Menu
const burgerMenu = document.getElementById('burger-menu');
const navLinks = document.querySelector('.nav-links');

// Search
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const locateButton = document.getElementById('locate-button');
const suggestionsPanel = document.getElementById('suggestions-panel');
const searchContainer = document.querySelector('.search-container');

// Tabs
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

// "Now" Tab
const weatherPanel = document.getElementById('weather-panel');
const locationName = document.getElementById('location-name');

// === NEW: Favorite & Time DOM Elements ===
const favoriteButton = document.getElementById('favorite-button');
const localTimeDisplay = document.getElementById('local-time-display');

const tempDisplay = document.getElementById('temp-display');
const conditionDisplay = document.getElementById('condition-display');
const feelsLikeDisplay = document.getElementById('feels-like-display');
const personalSuggestion = document.getElementById('personal-suggestion');
const humidityData = document.getElementById('humidity-data');
const windData = document.getElementById('wind-data');
const pressureData = document.getElementById('pressure-data');
const visibilityData = document.getElementById('visibility-data');
const sunriseData = document.getElementById('sunrise-data');
const sunsetData = document.getElementById('sunset-data');

// AQI Panel
const aqiPanel = document.getElementById('aqi-panel');
const aqiValue = document.getElementById('aqi-value');
const aqiCategory = document.getElementById('aqi-category');
const aqiPollutant = document.getElementById('aqi-pollutant');

// "Forecast" Tab
const hourlyForecastContainer = document.getElementById('hourly-forecast-container');
const dailyForecastContainer = document.getElementById('daily-forecast-container');

// "News" Tab
const newsPanel = document.getElementById('news-panel');
const newsContainer = document.getElementById('news-container');
const newsLoadingMessage = document.getElementById('news-loading-message');

// === NEW: Favorites List ===
const favoritesList = document.getElementById('favorites-list');

// Globe
const globeContainer = document.getElementById('globe-container');
const globeLoading = document.getElementById('globe-loading');

// Notification
const notificationContainer = document.getElementById('notification-container');

// ==================== GLOBAL STATE ====================
let globe = null;
let markers = [];
// === NEW: Global variables for our new features ===
let favorites = []; // Array to hold favorite { name, lat, lon } objects
let currentLocationData = null; // Stores data of the currently displayed city
let clockInterval = null; // Holds the setInterval for the clock

// ==================== GLOBE INITIALIZATION ====================
function initGlobe() {
  try {
    if (typeof Globe === 'undefined' || typeof THREE === 'undefined') {
      console.error('Globe.gl or Three.js not loaded');
      setTimeout(() => {
        if (globeLoading) globeLoading.classList.add('hidden');
      }, 2000);
      return;
    }

    globe = Globe()(globeContainer)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData([])
      .pointAltitude('size')
      .pointColor(() => '#990606ff')
      .pointRadius(0.25)
      .pointsMerge(false)
      .ringsData([])
      .ringColor(() => t => `rgba(255, 71, 87, ${1 - t})`)
      .ringMaxRadius(4)
      .ringPropagationSpeed(3)
      .ringRepeatPeriod(1200)
      .labelsData([])
      .labelText('city')
      .labelSize(1.2)
      .labelColor(() => '#000000ff')
      .labelDotRadius(0.3)
      .labelAltitude(0.02)
      .atmosphereColor('#1e90ff')
      .atmosphereAltitude(0.15);

    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = true;
    controls.minDistance = 180;
    controls.maxDistance = 500;

    const scene = globe.scene();
    scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-1, 0.5, 1);
    scene.add(directionalLight);

    function handleResize() {
      if (globe && globeContainer) {
        globe.width(globeContainer.offsetWidth);
        globe.height(globeContainer.offsetHeight);
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    globe.onGlobeClick(({ lat, lng }) => {
      console.log(`Clicked at: ${lat}, ${lng}`);
      globe.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
      // === NEW: Click globe to find city ===
      handleLocateMe(lat, lng);
    });

    setTimeout(() => {
      if (globeLoading) globeLoading.classList.add('hidden');
    }, 1000);

  } catch (error) {
    console.error('Error initializing globe:', error);
    if (globeLoading) globeLoading.classList.add('hidden');
  }
}

// ==================== THEME MANAGEMENT ====================
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  if (globe) {
    try {
      if (theme === 'light') {
        globe.backgroundImageUrl(null);
        globe.atmosphereColor('#4d91ff');
      } else {
        globe.backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png');
        globe.atmosphereColor('#1e90ff');
      }
    } catch (error) {
      console.error('Error updating globe theme:', error);
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

// ==================== UNITS MANAGEMENT (NEW!) ====================
function setUnitToggleState(units) {
  if (units === 'imperial') {
    unitsToggle.classList.add('imperial');
  } else {
    unitsToggle.classList.remove('imperial');
  }
}

function handleUnitToggle() {
  const currentUnits = localStorage.getItem('units') || 'metric';
  const newUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
  localStorage.setItem('units', newUnits);
  setUnitToggleState(newUnits);

  // If a city is already loaded, re-fetch its data with the new units
  if (currentLocationData) {
    handleNewLocation(currentLocationData.locationString, currentLocationData.lat, currentLocationData.lon);
  }
}

function initUnits() {
  const savedUnits = localStorage.getItem('units') || 'metric';
  setUnitToggleState(savedUnits);
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
  const isExpanded = burgerMenu.getAttribute('aria-expanded') === 'true';
  burgerMenu.setAttribute('aria-expanded', !isExpanded);
  navLinks.classList.toggle('active');
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// ==================== TAB MANAGEMENT ====================
function initTabs() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      tabPanels.forEach(panel => {
        if (panel.id === `tab-${targetTab}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

// ==================== CITY SUGGESTIONS (Geocoding) ====================
async function getCitySuggestions() {
  const query = cityInput.value.trim();
  if (query.length < 3) {
    suggestionsPanel.style.display = 'none';
    return;
  }

  suggestionsPanel.innerHTML = '<button class="suggestion-item" disabled>Loading...</button>';
  suggestionsPanel.style.display = 'block';

  const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_KEY}`;

  try {
    const response = await fetch(geoURL);
    if (!response.ok) throw new Error('Geocoding API failed');
    const locations = await response.json();
    suggestionsPanel.innerHTML = ''; 

    if (locations.length === 0) {
      suggestionsPanel.innerHTML = '<button class="suggestion-item" disabled>No cities found.</button>';
      return;
    }

    locations.forEach(location => {
      const item = document.createElement('button');
      item.className = 'suggestion-item';
      
      const name = `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`;
      item.textContent = name;
      
      item.addEventListener('click', () => {
        handleNewLocation(name, location.lat, location.lon);
        suggestionsPanel.style.display = 'none';
        cityInput.value = name;
      });
      
      suggestionsPanel.appendChild(item);
    });

  } catch (error) {
    console.error('Suggestion fetch error:', error);
    suggestionsPanel.innerHTML = '<button class="suggestion-item" disabled>Error finding cities.</button>';
  }
}

// ==================== "FIND MY LOCATION" HANDLER (Updated!) ====================
async function handleLocateMe(lat, lon) {
  if (!lat || !lon) {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser', 'error');
      return;
    }
    showNotification('Finding your location...', 'info');
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch (error) {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        showNotification('You denied location access.', 'error');
      } else {
        showNotification(`Error finding location: ${error.message}`, 'error');
      }
      return;
    }
  }

  // === NEW: Reverse Geocoding part ===
  try {
    const reverseGeoURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`;
    const response = await fetch(reverseGeoURL);
    if (!response.ok) throw new Error('Could not find location name');
    
    const data = await response.json();
    if (data.length === 0) throw new Error('Could not find location name');

    const location = data[0];
    const locationString = `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`;
    
    cityInput.value = locationString;
    handleNewLocation(locationString, lat, lon);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    showNotification(error.message, 'error');
  }
}


// ==================== MASTER DATA HANDLER (Updated!) ====================
async function handleNewLocation(locationString, lat, lon) {
  weatherPanel.classList.add('loading');
  resetWeatherUI(); // Reset UI and stop clock

  // === NEW: Get selected units from storage ===
  const units = localStorage.getItem('units') || 'metric';
  
  // Store current location for favorites and unit toggle
  currentLocationData = { locationString, lat, lon };

  try {
    // Pass units to fetch functions
    const [weatherData, forecastData] = await Promise.all([
      fetchCurrentWeather(lat, lon, units),
      fetchForecast(lat, lon, units),
      fetchAQI(lat, lon)
    ]);
    
    // === NEW: Store timezone and start clock ===
    currentLocationData.timezone = weatherData.timezone;
    startClock(weatherData.timezone);
    
    // Pass units to UI update functions
    updateWeatherUI(weatherData, locationString, units);
    updateHourlyForecast(forecastData.list, units);
    updateDailyForecast(forecastData.list, units);
    
    fetchNews(locationString); 
    updateGlobe(lat, lon, locationString);
    
    // === NEW: Update favorite button state ===
    const isFavorite = favorites.some(fav => fav.name === locationString);
    updateFavoriteButtonState(isFavorite);
    
    // Save to localStorage
    localStorage.setItem('lastCity', locationString);
    localStorage.setItem('lastLat', lat);
    localStorage.setItem('lastLon', lon);
    
    showNotification('✓ Weather data loaded', 'success');
    
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    showNotification(`⚠️ ${error.message}`, 'error');
    locationName.textContent = error.message;
    resetWeatherUI();
  } finally {
    weatherPanel.classList.remove('loading');
  }
}

// ==================== API FETCH FUNCTIONS (Updated!) ====================

// === UPDATED: Now accepts a 'units' argument ===
async function fetchCurrentWeather(lat, lon, units) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Current weather data failed');
  return response.json();
}

// === UPDATED: Now accepts a 'units' argument ===
async function fetchForecast(lat, lon, units) {
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=${units}`;
  const response = await fetch(forecastURL);
  if (!response.ok) throw new Error('Forecast data failed');
  return response.json();
}

async function fetchAQI(lat, lon) {
  aqiPanel.style.display = 'block';
  aqiValue.textContent = "--";
  aqiCategory.textContent = "Loading...";
  aqiCategory.className = "aqi-category";
  aqiPollutant.textContent = "--";

  const aqiURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`;

  try {
    const response = await fetch(aqiURL);
    if (!response.ok) throw new Error('AQI API failed');
    const data = await response.json();
    
    if (data.list && data.list.length > 0) {
      const aqi = data.list[0].main.aqi;
      const components = data.list[0].components;
      const { text, className } = getAQIDescription(aqi);
      
      aqiValue.textContent = aqi;
      aqiValue.className = `aqi-value ${className}`;
      aqiCategory.textContent = text;
      aqiCategory.className = `aqi-category ${className}`;
      aqiPollutant.textContent = `PM2.5: ${components.pm2_5.toFixed(2)} µg/m³`;
    }
  } catch (error) {
    console.error('AQI fetch error:', error);
    aqiPanel.style.display = 'none';
  }
}

// === This is your working PHP proxy fetch! No changes needed ===
async function fetchNews(locationString) {
  newsPanel.classList.add('loading');
  newsContainer.innerHTML = '';
  const cityName = locationString.split(',')[0]; 
  const query = `weather ${cityName}`;
  const url = `get-news.php?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'error' || data.errors) {
      let errorMessage = data.message || (data.errors ? data.errors[0] : 'Unknown news error');
      throw new Error(errorMessage);
    }

    if (!data.articles || data.articles.length === 0) {
      newsContainer.innerHTML = `<div class="news-loading">No weather news found for ${cityName}.</div>`;
      return;
    }
    
    newsContainer.innerHTML = '';
    data.articles.forEach((article, index) => {
      newsContainer.appendChild(createNewsItem(article, index));
    });
  } catch (error) {
    console.error('News fetch error:', error);
    newsContainer.innerHTML = `<div class="news-loading">Could not load news. ${error.message}</div>`;
  } finally {
    newsPanel.classList.remove('loading');
  }
}

// ==================== UI UPDATE FUNCTIONS (Updated!) ====================

// === UPDATED: Now accepts 'units' to display correct symbols ===
function updateWeatherUI(data, locationString, units) {
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const speedUnit = units === 'metric' ? 'm/s' : 'mph';
  
  locationName.textContent = locationString;
  tempDisplay.textContent = `${Math.round(data.main.temp)}°`;
  conditionDisplay.textContent = data.weather[0].main;
  feelsLikeDisplay.textContent = `Feels like ${Math.round(data.main.feels_like)}${tempUnit}`;
  
  humidityData.textContent = `${data.main.humidity}%`;
  windData.textContent = `${data.wind.speed} ${speedUnit}`;
  pressureData.textContent = `${data.main.pressure} hPa`;
  visibilityData.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  
  sunriseData.textContent = formatTime(data.sys.sunrise, data.timezone);
  sunsetData.textContent = formatTime(data.sys.sunset, data.timezone);
  
  updatePersonalSuggestion(data.weather[0].main, data.main.temp, units);
}

// === UPDATED: Now accepts 'units' for personal message ===
function updatePersonalSuggestion(condition, temp, units) {
  let suggestionText = "";
  const tempInC = (units === 'imperial') ? (temp - 32) * 5/9 : temp;

  if (condition.includes("Rain") || condition.includes("Storm") || condition.includes("Drizzle")) {
    suggestionText = "🌧️ Perfect weather to stay in and code, Dhyani!";
  } else if (condition.includes("Clear") && tempInC > 25) {
    suggestionText = "☀️ Beautiful, sunny day! Don't forget to stay hydrated.";
  } else if (condition.includes("Clear") && tempInC < 10) {
    suggestionText = "❄️ Clear but chilly! Bundle up if you go out.";
  } else if (condition.includes("Snow")) {
    suggestionText = "☃️ It's snowing! A lovely day to watch from the window.";
  } else if (condition.includes("Clouds")) {
    suggestionText = "☁️ A calm, cloudy day. Great for focusing.";
  } else {
    suggestionText = "Have a wonderful day!";
  }
  personalSuggestion.textContent = suggestionText;
}

// === UPDATED: Now accepts 'units' for temp symbol ===
function updateHourlyForecast(forecastList, units) {
  hourlyForecastContainer.innerHTML = '';
  const next24Hours = forecastList.slice(0, 8);
  const tempUnit = units === 'metric' ? '°' : '°'; // Just the symbol for compact view
  
  next24Hours.forEach(hour => {
    const item = document.createElement('div');
    item.className = 'hourly-item';
    
    const icon = hour.weather[0].icon;
    const temp = Math.round(hour.main.temp);
    
    item.innerHTML = `
      <span class="hourly-time">${formatTime(hour.dt, currentLocationData.timezone, true)}</span>
      <span class="hourly-icon">
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${hour.weather[0].description}">
      </span>
      <span class="hourly-temp">${temp}${tempUnit}</span>
    `;
    hourlyForecastContainer.appendChild(item);
  });
}

// === UPDATED: Now accepts 'units' for temp symbol ===
function updateDailyForecast(forecastList, units) {
  dailyForecastContainer.innerHTML = '';
  const tempUnit = units === 'metric' ? '°C' : '°F';
  
  const dailyForecasts = forecastList.filter(item => {
    return item.dt_txt.includes("12:00:00");
  });
  
  dailyForecasts.forEach(day => {
    const item = document.createElement('div');
    item.className = 'daily-item';
    
    const icon = day.weather[0].icon;
    const temp = Math.round(day.main.temp);
    
    item.innerHTML = `
      <span class="daily-day">${formatForecastDay(day.dt)}</span>
      <span class="daily-icon">
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
      </span>
      <span class="daily-temp">${temp}${tempUnit}</span>
    `;
    dailyForecastContainer.appendChild(item);
  });
}

// === UPDATED: Now resets new features ===
function resetWeatherUI() {
  stopClock(); // Stop the clock
  currentLocationData = null; // Clear current location
  updateFavoriteButtonState(false); // Reset favorite button

  locationName.textContent = "Search a city to explore";
  localTimeDisplay.textContent = ""; // Clear local time
  tempDisplay.textContent = '--°';
  conditionDisplay.textContent = '--';
  feelsLikeDisplay.textContent = '';
  personalSuggestion.textContent = '';
  humidityData.textContent = '--%';
  windData.textContent = '-- m/s';
  pressureData.textContent = '-- hPa';
  visibilityData.textContent = '-- km';
  sunriseData.textContent = '--:--';
  sunsetData.textContent = '--:--';
  
  aqiPanel.style.display = 'none';
  hourlyForecastContainer.innerHTML = '';
  dailyForecastContainer.innerHTML = '';
  newsContainer.innerHTML = `<div class="news-loading" id="news-loading-message">Search a city to see related news.</div>`;
}

function createNewsItem(article, index) {
  const item = document.createElement('a');
  item.href = article.url;
  item.target = '_blank';
  item.rel = 'noopener noreferrer';
  item.className = 'news-item';
  item.style.animationDelay = `${index * 0.1}s`;

  item.innerHTML = `
    <div class="news-item-header">
      <div class="news-item-content">
        <div class="news-item-title">${article.title}</div>
        <div class="news-item-source">${article.source.name}</div>
      </div>
      <i class="fas fa-external-link-alt news-item-icon"></i>
    </div>
  `;
  return item;
}

function updateGlobe(lat, lng, city) {
  if (!globe) return;
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Invalid coordinates');
    }
    markers = [{ lat, lng, size: 0.8, color: '#ff4757' }];
    globe.pointsData(markers);
    globe.ringsData([{ lat, lng }]);
    globe.labelsData([{ lat, lng, city: city.split(',')[0] }]);
    const controls = globe.controls();
    controls.autoRotate = false;
    globe.pointOfView({ lat, lng, altitude: 1.5 }, 2500);
    setTimeout(() => (controls.autoRotate = true), 3500);
  } catch (error) {
    console.error('Error updating globe:', error);
  }
}

// ==================== CLOCK FUNCTIONS (NEW!) ====================
function startClock(timezoneOffset) {
  stopClock(); // Clear any existing clock
  
  clockInterval = setInterval(() => {
    const now = new Date();
    // Get UTC time in milliseconds
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Create new Date object for the city's local time
    const localTime = new Date(utc + (timezoneOffset * 1000));
    
    // Format it nicely
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      weekday: 'short'
    };
    localTimeDisplay.textContent = localTime.toLocaleString('en-US', options);
  }, 1000);
}

function stopClock() {
  clearInterval(clockInterval);
  clockInterval = null;
  localTimeDisplay.textContent = "";
}

// ==================== FAVORITES FUNCTIONS (NEW!) ====================
function loadFavorites() {
  favorites = JSON.parse(localStorage.getItem('climaGlobeFavorites')) || [];
}

function saveFavorites() {
  localStorage.setItem('climaGlobeFavorites', JSON.stringify(favorites));
}

function renderFavoritesList() {
  favoritesList.innerHTML = ''; // Clear the list
  if (favorites.length === 0) {
    favoritesList.innerHTML = '<li class="favorites-list-empty">No favorites added.</li>';
    return;
  }
  
  favorites.forEach(fav => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'favorite-list-button';
    button.textContent = fav.name;
    button.dataset.name = fav.name;
    button.dataset.lat = fav.lat;
    button.dataset.lon = fav.lon;
    li.appendChild(button);
    favoritesList.appendChild(li);
  });
}

function handleAddFavorite() {
  if (!currentLocationData) return; // No city loaded

  const { locationString, lat, lon } = currentLocationData;
  const existingIndex = favorites.findIndex(fav => fav.name === locationString);
  
  if (existingIndex > -1) {
    // Already a favorite, so remove it
    favorites.splice(existingIndex, 1);
    updateFavoriteButtonState(false);
    showNotification('Removed from favorites', 'info');
  } else {
    // Not a favorite, so add it
    favorites.push({ name: locationString, lat, lon });
    updateFavoriteButtonState(true);
    showNotification('Added to favorites!', 'success');
  }
  
  saveFavorites();
  renderFavoritesList();
}

function updateFavoriteButtonState(isFavorite) {
  if (isFavorite) {
    favoriteButton.setAttribute('aria-pressed', 'true');
  } else {
    favoriteButton.setAttribute('aria-pressed', 'false');
  }
}

// ==================== HELPER FUNCTIONS (Updated!) ====================

// === UPDATED: Now accepts timezone for accurate local conversion ===
function formatTime(timestamp, timezoneOffset, hourOnly = false) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  
  const options = {
    hour: 'numeric',
    minute: (hourOnly ? undefined : '2-digit'),
    hour12: true,
    timeZone: 'UTC' // We've already manually adjusted for timezone
  };
  return date.toLocaleTimeString('en-US', options);
}

function formatForecastDay(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' });
}

function getAQIDescription(aqi) {
  switch (aqi) {
    case 1: return { text: "Good", className: "aqi-1" };
    case 2: return { text: "Fair", className: "aqi-2" };
    case 3: return { text: "Moderate", className: "aqi-3" };
    case 4: return { text: "Poor", className: "aqi-4" };
    case 5: return { text: "Very Poor", className: "aqi-5" };
    default: return { text: "--", className: "" };
  }
}

// ==================== EVENT LISTENERS (Updated!) ====================

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// === NEW: Unit toggle ===
unitsToggle.addEventListener('click', handleUnitToggle);

// Mobile menu
burgerMenu.addEventListener('click', toggleMobileMenu);

// Search
searchButton.addEventListener('click', getCitySuggestions);
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    getCitySuggestions();
  }
});

// "Find My Location" button
locateButton.addEventListener('click', () => handleLocateMe(null, null));

// === NEW: Favorite button ===
favoriteButton.addEventListener('click', handleAddFavorite);

// === NEW: Favorites list (Event Delegation) ===
favoritesList.addEventListener('click', (e) => {
  if (e.target.classList.contains('favorite-list-button')) {
    const { name, lat, lon } = e.target.dataset;
    handleNewLocation(name, parseFloat(lat), parseFloat(lon));
    // Close mobile menu after clicking
    if (navLinks.classList.contains('active')) {
      toggleMobileMenu();
    }
  }
});


// Hide suggestions on click outside
document.addEventListener('click', (e) => {
  if (!searchContainer.contains(e.target)) {
    suggestionsPanel.style.display = 'none';
  }
});

// Keyboard shortcut for search
window.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== cityInput) {
    e.preventDefault();
    cityInput.focus();
  }
});

// Network status
window.addEventListener('offline', () => {
  showNotification('⚠️ You are offline', 'error');
});
window.addEventListener('online', () => {
  showNotification('✓ Back online', 'success');
});

// ==================== INITIALIZATION (Updated!) ====================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUnits(); // === NEW: Initialize unit toggle
  initGlobe();
  initTabs();
  loadFavorites(); // === NEW: Load favorites from storage
  renderFavoritesList(); // === NEW: Display favorites in mobile menu

  // Load last searched city
  const lastCity = localStorage.getItem('lastCity');
  const lastLat = localStorage.getItem('lastLat');
  const lastLon = localStorage.getItem('lastLon');
  
  if (lastCity && lastLat && lastLon) {
    cityInput.value = lastCity;
    handleNewLocation(lastCity, parseFloat(lastLat), parseFloat(lastLon));
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && globe) {
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
    }
  }
});
