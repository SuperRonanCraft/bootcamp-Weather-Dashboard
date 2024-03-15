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
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=8&appid=${apiKey}`;
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
      // console.log(rData.list);
      const now = dayjs();
      forecastEl.empty();
      for (const weather of rData.list) {
        const then = dayjs.unix(weather.dt);
        if (then.hour() === 11) {
          createWeatherElement({
            time: then.format("MM/DD/YYYY"),
            temp: weather.main.temp,
            wind: weather.wind.speed,
            humidity: weather.main.humidity,
          });
        }
      }
    });
}

function createWeatherElement(data) {
  const weatherEl = $("<div>");
  weatherEl.append($(`<h4>${data.time}</h4>`));
  weatherEl.append($(`<p>Temp: ${data.temp} °F</p>`));
  weatherEl.append($(`<p>Wind: ${data.wind} MPH</p>`));
  weatherEl.append($(`<p>Humidity: ${data.humidity} %</p>`));

  const weatherContainerEl = $("<div>");
  weatherContainerEl.addClass(
    "bg-dark text-light col-12 col-sm-6 col-md-4 col-lg-2 rounded"
  );
  weatherContainerEl.append(weatherEl);
  forecastEl.append(weatherContainerEl);
}

function fetchWeather(data) {
  const url = `https://api.openweathermap.org/data/2.5/weather?units=imperial&lang=en&lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((rData) => {
      console.log(rData);
      $("#city").text(rData.name);
      $("#temp").text(`Temp: ${rData.main.temp} °F`);
      $("#wind").text(`Wind: ${rData.wind.speed} MPH`);
      $("#humidity").text(`Humidity: ${rData.main.humidity} %`);
      // console.log(data);
    });
}

onload = () => {
  createWeatherElement({
    time: "0",
    temp: 0,
    wind: 0,
    humidity: "100",
  });
};
//User Interactions
inputSearch.on("input", handleSearch);
inputSearch.on("search", clearSuggestions);
autoBox.on("click", handleSuggestionClick);
