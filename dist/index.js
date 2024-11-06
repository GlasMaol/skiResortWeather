"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const locationSelect = document.getElementById("location");
const getWeatherButton = document.getElementById("getWeather");
const weatherDisplay = document.getElementById("weatherDisplay");
const getPrecipitationCategory = (category) => {
    if (category === undefined)
        return "Unknown";
    switch (category) {
        case 0: return "No Precipitation";
        case 1: return "Light Precipitation";
        case 2: return "Moderate Precipitation";
        case 3: return "Heavy Precipitation";
        case 4: return "Very Heavy Precipitation";
        default: return "Unknown";
    }
};
const getPrecipitationType = (pcat) => {
    if (pcat === undefined)
        return "None";
    switch (pcat) {
        case 0: return "No Precipitation";
        case 1: return "Snow";
        case 2: return "Snow and Rain";
        case 3: return "Rain";
        case 4: return "Drizzle";
        case 5: return "Freezing Rain";
        case 6: return "Freezing Drizzle";
        default: return "unknown";
    }
};
const fetchFiveDayForecast = (latitude, longitude, resortName) => __awaiter(void 0, void 0, void 0, function* () {
    const apiUrl = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${longitude}/lat/${latitude}/data.json`;
    try {
        const response = yield fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = yield response.json();
        weatherDisplay.innerHTML = "";
        const resortTitle = document.createElement('h3');
        resortTitle.textContent = `Weather Forecast for ${resortName}`;
        weatherDisplay.appendChild(resortTitle);
        const fiveDayForecast = {};
        data.timeSeries.forEach(entry => {
            const validDate = new Date(entry.validTime).toISOString().split('T')[0];
            if (!fiveDayForecast[validDate]) {
                fiveDayForecast[validDate] = [];
            }
            fiveDayForecast[validDate].push(entry);
        });
        const today = new Date();
        const forecastDays = [];
        for (let i = 0; i < 5; i++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + i);
            const dateString = forecastDate.toISOString().split('T')[0];
            if (fiveDayForecast[dateString]) {
                forecastDays.push({ date: dateString, data: fiveDayForecast[dateString] });
            }
        }
        const forecastContainer = document.createElement('div');
        forecastContainer.className = 'forecast-row';
        forecastDays.forEach(day => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const dayData = day.data;
            const parameters = dayData[0].parameters;
            const temperatureMean = (_b = (_a = parameters.find(param => param.name === "t")) === null || _a === void 0 ? void 0 : _a.values[0]) !== null && _b !== void 0 ? _b : "N/A";
            const humidity = (_d = (_c = parameters.find(param => param.name === "r")) === null || _c === void 0 ? void 0 : _c.values[0]) !== null && _d !== void 0 ? _d : "N/A";
            const precipitationAmount = (_f = (_e = parameters.find(param => param.name === "pmax")) === null || _e === void 0 ? void 0 : _e.values[0]) !== null && _f !== void 0 ? _f : "N/A";
            const pcatValue = (_g = parameters.find(param => param.name === "pcat")) === null || _g === void 0 ? void 0 : _g.values[0];
            const precipitationCategory = getPrecipitationCategory(pcatValue);
            const precipitationType = getPrecipitationType(pcatValue);
            const windSpeed = (_j = (_h = parameters.find(param => param.name === "ws")) === null || _h === void 0 ? void 0 : _h.values[0]) !== null && _j !== void 0 ? _j : "N/A";
            const windGustSpeed = (_l = (_k = parameters.find(param => param.name === "gust")) === null || _k === void 0 ? void 0 : _k.values[0]) !== null && _l !== void 0 ? _l : "N/A";
            const windDirection = (_o = (_m = parameters.find(param => param.name === "wd")) === null || _m === void 0 ? void 0 : _m.values[0]) !== null && _o !== void 0 ? _o : "N/A";
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.innerHTML = `
                <h4>${day.date}</h4>
                <p><strong>Avg temp:</strong> ${temperatureMean} °C</p>
                <p><strong>Humidity:</strong> ${humidity} %</p>
                <p><strong>Precipitation:</strong> ${precipitationAmount} mm</p>
                <p><strong>Type:</strong> ${precipitationType}</p>
                <p><strong>Intensity:</strong> ${precipitationCategory}</p>
                <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
                <p><strong>Gust Speed:</strong> ${windGustSpeed} m/s</p>
                <p><strong>Wind Dir:</strong> ${windDirection}°</p>
            `;
            dayElement.addEventListener('click', () => displayHourlyForecast(day.data, day.date));
            forecastContainer.appendChild(dayElement);
        });
        weatherDisplay.appendChild(forecastContainer);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching weather data:", error.message);
            weatherDisplay.innerHTML = `<p>Error fetching weather data: ${error.message}</p>`;
        }
        else {
            console.error("Unexpected error:", error);
            weatherDisplay.innerHTML = `<p>An unexpected error occurred while fetching weather data.</p>`;
        }
    }
});
const displayHourlyForecast = (dayData, _date) => {
    const existingHourly = document.querySelector('.hourly-forecast');
    if (existingHourly) {
        existingHourly.remove();
    }
    const hourlyForecastContainer = document.createElement('div');
    hourlyForecastContainer.className = 'hourly-forecast forecast-row';
    dayData.forEach(entry => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const validTime = new Date(entry.validTime);
        const hourString = validTime.toISOString().split('T')[1].substring(0, 5);
        const parameters = entry.parameters;
        const temperature = (_b = (_a = parameters.find(param => param.name === "t")) === null || _a === void 0 ? void 0 : _a.values[0]) !== null && _b !== void 0 ? _b : "N/A";
        const humidity = (_d = (_c = parameters.find(param => param.name === "r")) === null || _c === void 0 ? void 0 : _c.values[0]) !== null && _d !== void 0 ? _d : "N/A";
        const precipitationAmount = (_f = (_e = parameters.find(param => param.name === "pmax")) === null || _e === void 0 ? void 0 : _e.values[0]) !== null && _f !== void 0 ? _f : "N/A";
        const pcatValue = (_g = parameters.find(param => param.name === "pcat")) === null || _g === void 0 ? void 0 : _g.values[0];
        const precipitationType = getPrecipitationType(pcatValue);
        const windSpeed = (_j = (_h = parameters.find(param => param.name === "ws")) === null || _h === void 0 ? void 0 : _h.values[0]) !== null && _j !== void 0 ? _j : "N/A";
        const windGustSpeed = (_l = (_k = parameters.find(param => param.name === "gust")) === null || _k === void 0 ? void 0 : _k.values[0]) !== null && _l !== void 0 ? _l : "N/A";
        const windDirection = (_o = (_m = parameters.find(param => param.name === "wd")) === null || _m === void 0 ? void 0 : _m.values[0]) !== null && _o !== void 0 ? _o : "N/A";
        const hourElement = document.createElement('div');
        hourElement.className = 'hour';
        hourElement.innerHTML = `
            <h5>${hourString}</h5>
            <p><strong>Temp:</strong> ${temperature} °C</p>
            <p><strong>Humidity:</strong> ${humidity} %</p>
            <p><strong>Precip:</strong> ${precipitationAmount} mm</p>
            <p><strong>Type:</strong> ${precipitationType}</p>
            <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
            <p><strong>Gust:</strong> ${windGustSpeed} m/s</p>
            <p><strong>Direction:</strong> ${windDirection}°</p>
        `;
        hourlyForecastContainer.appendChild(hourElement);
    });
    weatherDisplay.appendChild(hourlyForecastContainer);
};
const saveRecentLocation = (name, coords) => {
    let recentLocations = JSON.parse(localStorage.getItem('recentLocations') || '[]');
    recentLocations = recentLocations.filter((location) => location.coords !== coords);
    recentLocations.push({ name, coords });
    if (recentLocations.length > 5) {
        recentLocations.shift();
    }
    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    renderRecentLocations();
};
const renderRecentLocations = () => {
    const recentLocations = JSON.parse(localStorage.getItem('recentLocations') || '[]');
    const recentLocationsContainer = document.getElementById('recentLocationsContainer');
    recentLocationsContainer.innerHTML = '';
    const heading = document.createElement('h2');
    heading.textContent = 'Recently Viewed';
    recentLocationsContainer.appendChild(heading);
    recentLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.coords;
        option.textContent = location.name;
        option.addEventListener('click', () => {
            const selectedLocation = location.coords.split(',');
            const latitude = parseFloat(selectedLocation[0]);
            const longitude = parseFloat(selectedLocation[1]);
            const resortName = location.name;
            fetchFiveDayForecast(latitude, longitude, resortName);
        });
        recentLocationsContainer.appendChild(option);
    });
};
getWeatherButton.addEventListener("click", () => {
    const selectedLocation = locationSelect.value.split(',');
    const latitude = parseFloat(selectedLocation[0]);
    const longitude = parseFloat(selectedLocation[1]);
    const resortName = locationSelect.options[locationSelect.selectedIndex].text;
    fetchFiveDayForecast(latitude, longitude, resortName);
});
locationSelect.addEventListener("change", () => {
    const selectedOption = locationSelect.options[locationSelect.selectedIndex];
    const coords = selectedOption.value;
    const name = selectedOption.textContent || '';
    saveRecentLocation(name, coords);
});
document.addEventListener('DOMContentLoaded', () => {
    renderRecentLocations();
});
