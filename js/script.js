// --- API Keys ---
const apiKey = "bf38a9fa795fa446286263521f5a987d"; // OpenWeatherMap key
const unsplashKey = "R5Mt-ro0gHtYsE2qYHshXnaLfZHBON-E1aB7iM0_hzs"; // Unsplash key

// DOM elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherDiv = document.getElementById("weatherResult");

// Handle search click
searchBtn.addEventListener("click", () => {
  const cityName = cityInput.value.trim();
  if (!cityName) return alert("Please enter a city name.");
  fetchWeather(cityName);
});

// --- Main weather function ---
async function fetchWeather(city) {
  try {
    // 1️⃣ Get coordinates
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();
    if (!geoData.length) return alert("City not found!");

    const { lat, lon, name, country } = geoData[0];

    // 2️⃣ Get weather data
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();
    if (data.cod !== 200) return alert("Weather data not found!");

    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const condition = data.weather[0].main;
    const timezone = data.timezone; // seconds offset from UTC

    // 3️⃣ Compute correct city local time
    const utcTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const cityTime = new Date(utcTime + timezone * 1000);

    const hours = cityTime.getHours();
    const minutes = cityTime.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes < 10 ? "0" + minutes : minutes;
    const localTimeStr = `${displayHour}:${displayMinutes} ${ampm}`;

    // 4️⃣ Witty line
    const cityLine = getCityLine(name, country, condition, temp);

    // 5️⃣ Get city photo
    const cityPhoto = await fetchCityPhoto(`${name} ${country} city skyline`, condition, hours);

    // 6️⃣ Display results
    weatherDiv.style.display = "block";
    weatherDiv.innerHTML = `
      <h2>Weather in ${name}, ${country}</h2>
      <p><b>Local Time:</b> ${localTimeStr}</p>
      <p><b>Temperature:</b> ${temp}°C</p>
      <p><b>Condition:</b> ${data.weather[0].description}</p>
      <p><b>Wind Speed:</b> ${wind} m/s</p>
      <p><b>Humidity:</b> ${humidity}%</p>
      <p class="suggestion" style="font-size:1.2rem; font-weight:600; margin-top:10px;">${cityLine}</p>
      <img src="${cityPhoto}" alt="${name}">
    `;
  } catch (err) {
    console.error(err);
    alert("Failed to fetch weather data. Please check your API keys and internet connection.");
  }
}

// --- Fun city line generator ---
function getCityLine(city, country, condition, temp) {
  const c = condition.toLowerCase();
  if (c.includes("rain")) return `${city} is dancing in the rain today 🌧️`;
  if (c.includes("thunder")) return `Thunder roars over ${city}! Stay safe ⚡`;
  if (c.includes("drizzle")) return `${city} has a gentle drizzle — perfect for coffee ☕`;
  if (c.includes("snow")) return `${city} looks magical under a blanket of snow ❄️`;
  if (c.includes("fog")) return `${city} is wrapped in fog — mysterious and calm 🌫️`;
  if (c.includes("mist")) return `${city} feels dreamy in the morning mist 🌁`;
  if (c.includes("haze")) return `${city} is a bit hazy, but the vibe’s still strong 😎`;
  if (c.includes("smoke")) return `Smoky skies hover over ${city} — stay indoors if you can 🚭`;
  if (c.includes("dust")) return `${city} feels dusty today — goggles recommended 😷`;
  if (c.includes("sand")) return `${city} is feeling sandy winds — desert mode on 🏜️`;
  if (c.includes("cloud")) return `${city} is covered in cozy clouds ☁️`;
  if (c.includes("clear")) return `${city} shines bright under clear skies ☀️`;
  return `${city} feels great at ${temp}°C — perfect day to explore! 🌤️`;
}

// --- Fallback photo selector ---
function getPhoto(condition) {
  condition = condition.toLowerCase();
  const photos = {
    rain: ["https://images.unsplash.com/photo-1508697014387-23f0d3b2f86f?auto=format&fit=crop&w=1200&q=80"],
    clear: ["https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80"],
    cloud: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"],
    snow: ["https://images.unsplash.com/photo-1608889175123-378b3d78ed8c?auto=format&fit=crop&w=1200&q=80"],
    default: ["https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1200&q=80"]
  };
  for (const key in photos) if (condition.includes(key)) return photos[key][0];
  return photos.default[0];
}

// --- Fetch city photo ---
async function fetchCityPhoto(cityQuery, condition, localHour) {
  try {
    let timeOfDay = "day";
    if (localHour >= 5 && localHour < 12) timeOfDay = "morning";
    else if (localHour >= 12 && localHour < 17) timeOfDay = "afternoon";
    else if (localHour >= 17 && localHour < 20) timeOfDay = "evening";
    else timeOfDay = "night";

    const query = `${cityQuery} ${condition} ${timeOfDay}`;
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${unsplashKey}&per_page=10`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) return getPhoto(condition);
    const randomIndex = Math.floor(Math.random() * data.results.length);
    return data.results[randomIndex].urls.regular;
  } catch {
    return getPhoto(condition);
  }
}
