//Dependencies
const inputSearch = $("#search-input");
const autoBox = $("#autocomplete-box");
const forecastEl = $("#forecast");
const historyEl = $("#history");
const apiKey = "81f5de324935a1e9a4ba6383132f2d99";

//Data
let slowedFetch = null;

//Functions

//Fetch a list of available cities via what a user inputs in search bar
function fetchGeocode() {
  slowedFetch = null;
  const input = inputSearch.val();
  if (input === "") return;
  //Url of Open Weather App
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=8&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      //Convert data to JSON
      return response.json();
    })
    .then((data) => {
      //Empty current suggestions
      autoBox.empty();
      //Make a suggestion/button for each result returned
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
      }
    });
}

//Clean up suggestions/autocomplete box
function clearSuggestions() {
  autoBox.empty();
  inputSearch.val("");
}

//Suggestions for cities that match users input
function handleSearch(event) {
  if (slowedFetch !== null) clearTimeout(slowedFetch);
  slowedFetch = setTimeout(fetchGeocode, 300);
}

//When someone clicks a suggested city, fetch weather of that city
function handleSuggestionClick(event) {
  const target = $(event.target);
  const data = target.data("data");
  clearSuggestions();
  //Grab weather data
  getWeather(data);
  //Add to the list of recent history
  addHistory(data);
}

//Add an input to recent search history
function addHistory(data) {
  //Pull hisotry from localStorage
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];

  //Remove previously searched city and move it to the top
  for (const previousCity of history) {
    if (previousCity.lat === data.lat && previousCity.lon === data.lon) {
      history.splice(history.indexOf(previousCity), 1);
      break;
    }
  }

  //Add city to beggining of array
  history.unshift(data);
  //Save Data
  localStorage.setItem("cityHistory", JSON.stringify(history));
  //Display history list
  showHistory();
}

//Display all recent city searches
function showHistory() {
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];
  historyEl.empty();
  //Go over all cities in storage
  for (const previousCity of history) {
    //Create a button element for each city
    historyEl.append(
      $(`<button>${previousCity.city} - ${previousCity.state}</button>`)
        .addClass("w-100 btn btn-secondary my-1")
        .data("data", previousCity)
    );
  }
}

//Grab both Forecast and current weather
function getWeather(data) {
  fetchWeather(data);
  fetchForecast(data);
}

//Grab 5 day forecast
function fetchForecast(data) {
  //We can't use `daily` endpoint due to subscription, so we just forecast
  //filtering by 12:00:00 timestamps
  const url = `https://api.openweathermap.org/data/2.5/forecast?units=imperial&lang=en&lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((rData) => {
      forecastEl.empty();
      for (const weather of rData.list) {
        const then = dayjs.unix(weather.dt);
        //Filter by forecast at 12 o'clock
        if (then.hour() === 11) {
          //Display forecast data
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

//Create element for each forecast result
function createWeatherElement(data) {
  const weatherEl = $("<div>");
  if (data.time)
    //Time of forecast
    weatherEl.append(
      $(`<h4>${data.time}</h4>`).addClass("card-header text-center")
    );
  if (data.temp)
    //Temperature
    weatherEl.append(
      $(`<p><strong>Temp: ${data.temp} °F</strong></p>`).addClass("px-2")
    );
  if (data.wind)
    //Wind
    weatherEl.append(
      $(`<p><strong>Wind: ${data.wind} MPH</strong></p>`).addClass("px-2")
    );
  if (data.humidity)
    //Humidity
    weatherEl.append(
      $(`<p><strong>Humidity: ${data.humidity} %</strong></p>`).addClass("px-2")
    );
  if (data.icon) {
    //Icon/Image
    weatherEl.append(
      $(`<img src="${getIcon(data.icon)}">`).addClass("mx-auto d-block")
    );
  }
  if (data.desc)
    //Description of weather
    weatherEl.append(
      $(`<h6>${data.desc}</h6>`).addClass("capitalize text-center")
    );

  //Add all styling/css to containing element
  weatherEl.addClass(
    "p-0 card bg-secondary text-light col-12 col-sm-6 col-md-4 col-lg-4 col-xl-2 rounded mb-3"
  );

  //Add element to forecast div of html
  forecastEl.append(weatherEl);
}

//Return the url of the Open Weather Map icon api
function getIcon(iconId) {
  return `https://openweathermap.org/img/wn/${iconId}@2x.png`;
}

//Set the weather divs info
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

//Fetch the current cities weather
function fetchWeather(data) {
  //Open Weather Map 'weather' endpoint grabs current weather data
  const url = `https://api.openweathermap.org/data/2.5/weather?units=imperial&lang=en&lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((rData) => {
      //Display current weather to display
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

//Loads upon loading the most recently searched for city
function loadLastHistory() {
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];
  if (history === null) return;
  const lastCity = history[0];
  getWeather(lastCity);
}

//Set default displayed data on load
onload = () => {
  //History List
  showHistory();
  //Display 5 fake forecasts upon loading
  for (let i = 0; i < 5; i++) {
    createWeatherElement({
      time: "mm/dd/yy",
      temp: "0",
      wind: "0",
      humidity: "100",
    });
  }
  //Loads last city
  loadLastHistory();
};

//User Interactions
//Search bar event when someone inputs text
inputSearch.on("input", handleSearch);
//Search bar event when someone clicks the X button
inputSearch.on("search", clearSuggestions);
//Autocomplete div when someone clicks a suggestion
autoBox.on("click", handleSuggestionClick);
//History element when someone clicks on a previous city (same data as autocomplete)
historyEl.on("click", handleSuggestionClick);
