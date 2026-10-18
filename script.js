// Open-Meteo Weather Codes Mapping
const weatherCodeMap = {
    0: 'Clear Sky ☀️',
    1: 'Mainly Clear 🌤️',
    2: 'Partly Cloudy ⛅',
    3: 'Overcast ☁️',
    45: 'Foggy 🌫️',
    48: 'Depositing Rime Fog 🌫️',
    51: 'Light Drizzle 🌧️',
    61: 'Slight Rain 🌧️',
    63: 'Moderate Rain 🌧️',
    65: 'Heavy Rain 🌧️',
    71: 'Slight Snow ❄️',
    80: 'Rain Showers 🌦️',
    95: 'Thunderstorm ⛈️'
};

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('errorMsg');
const weatherDisplay = document.getElementById('weatherDisplay');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchCoordinatesByCity(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchCoordinatesByCity(city);
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(latitude, longitude, "Current Location");
            },
            () => showError("Location access denied. Please search for a city manually.")
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

// Step 1: Geocoding API - Convert City Name to Lat/Long
async function fetchCoordinatesByCity(cityName) {
    showLoading(true);
    hideError();

    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            showError(`City "${cityName}" not found. Please check spelling.`);
            return;
        }

        const { latitude, longitude, name, country } = data.results[0];
        fetchWeatherData(latitude, longitude, `${name}, ${country}`);
    } catch (err) {
        showError("Failed to fetch location data. Please check your network connection.");
    }
}

// Step 2: Fetch Weather Data using Latitude & Longitude
async function fetchWeatherData(lat, lon, locationLabel) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        renderWeather(data, locationLabel);
    } catch (err) {
        showError("Unable to retrieve weather forecast.");
    } finally {
        showLoading(false);
    }
}

// Step 3: Render Data to DOM
function renderWeather(data, locationLabel) {
    const current = data.current;
    const daily = data.daily;

    // Set Header
    document.getElementById('cityName').textContent = locationLabel;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    // Current Metrics
    document.getElementById('temperature').textContent = Math.round(current.temperature_2m);
    document.getElementById('weatherState').textContent = weatherCodeMap[current.weather_code] || 'Moderate Weather';
    document.getElementById('windSpeed').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('uvIndex').textContent = daily.uv_index_max[0] || 'N/A';

    // 5-Day Forecast
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];

        const card = document.createElement('div');
        card.className = 'forecast-day';
        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div style="margin: 5px 0;">${weatherCodeMap[code] || '🌤️'}</div>
            <div class="forecast-temp">${maxTemp}° / <span style="color:#7f8c8d">${minTemp}°</span></div>
        `;
        forecastContainer.appendChild(card);
    }

    weatherDisplay.classList.remove('hidden');
}

// Helper Functions
function showLoading(isLoading) {
    if (isLoading) {
        loading.classList.remove('hidden');
        weatherDisplay.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    showLoading(false);
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
}

function hideError() {
    errorMsg.classList.add('hidden');
}

// Initial Load Default City
fetchCoordinatesByCity("London");