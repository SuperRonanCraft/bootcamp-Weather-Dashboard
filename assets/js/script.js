//Dependencies
const inputSearch = $("#search-input");
const autoBox = $("#autocomplete-box");
const forecastEl = $("#forecast");
const historyEl = $("#history");
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

  //Remove previously searched city and move it to the top
  for (const previousCity of history) {
    if (previousCity.lat === data.lat && previousCity.lon === data.lon) {
      history.splice(history.indexOf(previousCity), 1);
      break;
    }
  }

  history.unshift(data);
  localStorage.setItem("cityHistory", JSON.stringify(history));
  showHistory();
}

function showHistory() {
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];
  historyEl.empty();
  for (const previousCity of history) {
    historyEl.append(
      $(`<button>${previousCity.city} - ${previousCity.state}</button>`)
        .addClass("w-100 btn btn-secondary my-1")
        .data("data", previousCity)
    );
  }
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
    weatherEl.append(
      $(`<h4>${data.time}</h4>`).addClass("card-header text-center")
    );
  if (data.temp)
    weatherEl.append(
      $(`<p><strong>Temp: ${data.temp} °F</strong></p>`).addClass("px-2")
    );
  if (data.wind)
    weatherEl.append(
      $(`<p><strong>Wind: ${data.wind} MPH</strong></p>`).addClass("px-2")
    );
  if (data.humidity)
    weatherEl.append(
      $(`<p><strong>Humidity: ${data.humidity} %</strong></p>`).addClass("px-2")
    );
  if (data.icon) {
    weatherEl.append(
      $(`<img src="${getIcon(data.icon)}">`).addClass("mx-auto d-block")
    );
  }
  if (data.desc)
    weatherEl.append($(`<h6>${data.desc}</h6>`).addClass("text-center"));

  //const weatherContainerEl = $("<div>");
  weatherEl.addClass(
    "p-0 card bg-secondary text-light col-12 col-sm-6 col-md-4 col-lg-4 col-xl-2 rounded mb-3"
  );
  //weatherContainerEl.append(weatherEl);
  forecastEl.append(weatherEl.addClass("p-0"));
}

function getIcon(iconId) {
  return `https://openweathermap.org/img/wn/${iconId}@2x.png`;
}

function setWeather(data) {
  if (data.city)
    $("#city").text(`${data.city} - ${dayjs().format("MM/DD/YYYY")}`);
  if (data.temp) $("#temp").html(`Temp: <strong>${data.temp}</strong> °F`);
  if (data.wind) $("#wind").html(`Wind: <strong>${data.wind}</strong> MPH`);
  if (data.humidity)
    $("#humidity").html(`Humidity: <strong>${data.humidity}</strong> %`);
  if (data.desc) $("#status").text(`${data.desc}`);
  if (data.icon) $("#weather-icon").attr("src", getIcon(data.icon));
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
        desc: rData.weather[0].description,
        icon: rData.weather[0].icon,
      });
      console.log(rData);
    });
}

function loadLastHistory() {
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];
  if (history === null) return;
  const lastCity = history[0];
  getWeather(lastCity);
}

//Set default displayed data on load
onload = () => {
  showHistory();
  loadLastHistory();
  for (let i = 0; i < 5; i++) {
    createWeatherElement({
      time: "mm/dd/yy",
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
historyEl.on("click", handleSuggestionClick);
