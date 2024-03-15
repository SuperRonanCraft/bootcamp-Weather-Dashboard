const inputSearch = $("#search-input");
const apiKey = "81f5de324935a1e9a4ba6383132f2d99";
// const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=8&appid=${apiKey}`;
// const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
let slowedFetch = null;

function fetchGeocode() {
  slowedFetch = null;
  const input = inputSearch.val();
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=8&appid=${apiKey}`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(data);
    });
}

function handleSearch(event) {
  if (slowedFetch !== null) clearTimeout(slowedFetch);
  slowedFetch = setTimeout(fetchGeocode, 300);
}

inputSearch.on("input", handleSearch);
