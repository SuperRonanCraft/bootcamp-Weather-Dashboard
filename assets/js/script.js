//Dependencies
const inputSearch = $("#search-input");
const autoBox = $("#autocomplete-box");
const forecastEl = $("#forecast");
const apiKey = "81f5de324935a1e9a4ba6383132f2d99";
// const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=8&appid=${apiKey}`;
// const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
let slowedFetch = null;

//Functions
function fetchGeocode() {
  slowedFetch = null;
  const input = inputSearch.val();
  if (input === "") return;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=8&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      autoBox.empty();
      for (const loc of data) {
        const locEl = $("<p>");
        locEl.addClass("suggestion");
        locEl.text(loc.name + " - " + loc.state);
        const data = {
          lon: loc.lon,
          lat: loc.lat,
          city: loc.name,
          state: loc.state,
        };
        locEl.data("data", data);
        autoBox.append(locEl);
        // console.log(loc);
      }
    });
}

function clearSuggestions() {
  autoBox.empty();
  inputSearch.val("");
}

function handleSearch(event) {
  if (slowedFetch !== null) clearTimeout(slowedFetch);
  slowedFetch = setTimeout(fetchGeocode, 300);
}

function handleSuggestionClick(event) {
  const target = $(event.target);
  const data = target.data("data");
  clearSuggestions();
  getWeather(data);
  addHistory(data);
}

function addHistory(data) {
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];
  history.push(data);
  localStorage.setItem("cityHistory", JSON.stringify(history));
}

function getWeather(data) {
  fetchForecast(data);
  fetchWeather(data);
}

function fetchForecast(data) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?units=imperial&lang=en&lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((rData) => {
      forecastEl.empty();
      for (const weather of rData.list) {
        const then = dayjs.unix(weather.dt);
        if (then.hour() === 11) {
          createWeatherElement({
            time: then.format("MM/DD/YYYY"),
            temp: weather.main.temp,
            wind: weather.wind.speed,
            humidity: weather.main.humidity,
            icon: weather.weather[0].icon,
            desc: weather.weather[0].description,
          });
          console.log(weather);
        }
      }
    });
}

function createWeatherElement(data) {
  const weatherEl = $("<div>");
  if (data.time)
    weatherEl.append($(`<h4>${data.time}</h4>`).addClass("text-center"));
  if (data.temp) weatherEl.append($(`<p>Temp: ${data.temp} °F</p>`));
  if (data.wind) weatherEl.append($(`<p>Wind: ${data.wind} MPH</p>`));
  if (data.humidity) weatherEl.append($(`<p>Humidity: ${data.humidity} %</p>`));
  if (data.icon) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    weatherEl.append($(`<img src="${iconUrl}">`).addClass("mx-auto d-block"));
  }
  if (data.desc)
    weatherEl.append($(`<h6>${data.desc}</h6>`).addClass("text-center"));

  const weatherContainerEl = $("<div>");
  weatherContainerEl.addClass(
    "bg-dark text-light col-12 col-sm-6 col-md-4 col-lg-2 rounded mb-3 mx-2"
  );
  weatherContainerEl.append(weatherEl);
  forecastEl.append(weatherContainerEl);
}

function setWeather(data) {
  if (data.city) $("#city").text(data.city);
  $("#temp").text(`Temp: ${data.temp} °F`);
  $("#wind").text(`Wind: ${data.wind} MPH`);
  $("#humidity").text(`Humidity: ${data.humidity} %`);
}

function fetchWeather(data) {
  const url = `https://api.openweathermap.org/data/2.5/weather?units=imperial&lang=en&lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((rData) => {
      setWeather({
        city: rData.name,
        temp: rData.main.temp,
        wind: rData.wind.speed,
        humidity: rData.main.humidity,
      });
    });
}

//Set default displayed data on load
onload = () => {
  for (let i = 0; i < 5; i++) {
    createWeatherElement({
      time: `Day: ${i + 1}`,
      temp: "0",
      wind: "0",
      humidity: "100",
    });
  }
};
//User Interactions
inputSearch.on("input", handleSearch);
inputSearch.on("search", clearSuggestions);
autoBox.on("click", handleSuggestionClick);
