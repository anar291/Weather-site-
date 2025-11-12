// main.js
// ClimaGlobe 3D — JS logic
const OPENWEATHER_KEY = '';

// DOM refs
const globeContainer = document.getElementById('three-container');
const searchBtn      = document.getElementById('search-button');
const cityInput      = document.getElementById('city-input');
const locationName   = document.getElementById('location-name');
const tempData       = document.getElementById('temp-data');
const conditionData  = document.getElementById('condition-data');
const humidityData   = document.getElementById('humidity-data');
const windData       = document.getElementById('wind-data');

// Utility
function debounce(fn, wait = 300) {
 let timer;
 return function (...args) {
   clearTimeout(timer);
   timer = setTimeout(() => fn.apply(this, args), wait);
 };
}

// Create globe
let markers = [];
const globe = Globe()(globeContainer)
 .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
 .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
 .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
 .showAtmosphere(true)
 .atmosphereColor('#0fb6ff')
 .atmosphereAltitude(0.25)
 .pointsData(markers)
 .pointAltitude('size')
 .pointColor(() => '#ff6b6b')
 .pointRadius(0.2)
 .ringsData([])
 .ringColor(() => 'rgba(255,100,100,0.9)')
 .ringAltitude(0.02)
 .ringMaxRadius(3)
 .ringPropagationSpeed(8)
 .ringRepeatPeriod(800);

globe.controls().autoRotate      = true;
globe.controls().autoRotateSpeed = 0.2;
globe.controls().enableZoom      = true;

setTimeout(() => {
 const mat = globe.globeMaterial && globe.globeMaterial();
 if (!mat) return;
 if (mat.map)    mat.map.anisotropy    = 16;
 if (mat.bumpMap) mat.bumpMap.anisotropy = 16;
}, 200);

// Restore last city
if (localStorage.getItem('lastCity')) {
 cityInput.value = localStorage.getItem('lastCity');
}

// UI & fetch logic
function announce(msg) {
 locationName.textContent = msg;
}
function setWeatherUI({ name = '--', temp = '--', condition = '--', humidity = '--', wind = '--' } = {}) {
 locationName.textContent   = name;
 tempData.textContent       = typeof temp === 'number'    ? `${Math.round(temp)} °C` : temp;
 conditionData.textContent  = condition;
 humidityData.textContent   = typeof humidity === 'number' ? `${humidity} %`     : humidity;
 windData.textContent       = typeof wind === 'number'     ? `${wind} m/s`        : wind;
}
async function fetchWithTimeout(url, opts = {}, timeout = 8000) {
 const controller = new AbortController();
 const signal     = controller.signal;
 const timer      = setTimeout(() => controller.abort(), timeout);
 try {
   const res = await fetch(url, { ...opts, signal });
   clearTimeout(timer);
   return res;
 } catch (err) {
   clearTimeout(timer);
   throw err;
 }
}
async function fetchWeather(city) {
 if (!city) return;
 announce('Loading...');
 const encoded = encodeURIComponent(city);
 const url     = `https://api.openweathermap.org/data/2.5/weather?q=${encoded}&appid=${OPENWEATHER_KEY}&units=metric`;
 try {
   const res = await fetchWithTimeout(url, {}, 10000);
   if (!res.ok) {
     if (res.status === 401) throw new Error('Invalid API key (401)');
     if (res.status === 404) throw new Error('City not found (404)');
     throw new Error(`OpenWeather error: ${res.status}`);
   }
   const data = await res.json();
   setWeatherUI({
     name     : `${data.name}${data.sys?.country ? ', ' + data.sys.country : ''}`,
     temp     : data.main?.temp,
     condition: data.weather?.[0]?.main || data.weather?.[0]?.description || '--',
     humidity : data.main?.humidity,
     wind     : data.wind?.speed,
   });
   try { localStorage.setItem('lastCity', city); } catch(e){}
   const lat = Number(data.coord?.lat);
   const lng = Number(data.coord?.lon);
   if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
     throw new Error('Invalid coordinates from API.');
   }
   markers = [{ lat, lng, size: 0.6 }];
   globe.pointsData(markers);
   globe.ringsData([{ lat, lng }]);
   globe.controls().autoRotate = false;
   globe.pointOfView({ lat, lng, altitude: 2.5 }, 1200);
   setTimeout(() => {
     globe.pointOfView({ lat, lng, altitude: 1.0 }, 900);
     setTimeout(() => (globe.controls().autoRotate = true), 1200);
   }, 1200);
 } catch (err) {
   console.error('fetchWeather error:', err);
   if (err.name === 'AbortError') {
     setWeatherUI({ name: 'Request timed out', temp: '--', condition: '--', humidity: '--', wind: '--' });
   } else if (err.message && err.message.includes('401')) {
     setWeatherUI({ name: 'Invalid API key', temp: '--', condition: '--', humidity: '--', wind: '--' });
   } else {
     setWeatherUI({ name: 'City not found', temp: '--', condition: '--', humidity: '--', wind: '--' });
   }
   markers = [];
   globe.pointsData(markers);
   globe.ringsData([]);
 }
}

// Event listeners
searchBtn.addEventListener('click', () => {
 const city = cityInput.value.trim();
 if (!city) return;
 fetchWeather(city);
});
cityInput.addEventListener('keypress', (e) => {
 if (e.key === 'Enter') {
   const city = cityInput.value.trim();
   if (!city) return;
   fetchWeather(city);
 }
});

// Keyboard shortcut
window.addEventListener('keydown', (e) => {
 if (e.key === '/' && document.activeElement !== cityInput) {
   e.preventDefault();
   cityInput.focus();
 }
});

// Online/offline
window.addEventListener('offline', () => { announce('You are offline — weather requests will likely fail.'); });
window.addEventListener('online',  () => { announce('Back online.'); });

// Mobile nav toggle logic
document.addEventListener('DOMContentLoaded', () => {
 const burger   = document.querySelector('.burger');
 const navLinks = document.querySelector('.nav-links');
 if (burger && navLinks) {
   burger.addEventListener('click', () => {
     const expanded = burger.getAttribute('aria-expanded') === 'true';
     burger.setAttribute('aria-expanded', String(!expanded));
     navLinks.classList.toggle('active');
   });
   // Close nav when link clicked (optional)
   navLinks.querySelectorAll('a').forEach(link => {
     link.addEventListener('click', () => {
       burger.setAttribute('aria-expanded','false');
       navLinks.classList.remove('active');
     });
   });
 }
});

// Expose for testing
window.fetchWeatherFor = (city) => fetchWeather(city);
