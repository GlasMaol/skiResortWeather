// SMHI API 5 day och hourly prognos. Recently viewed sparas i localstorage

interface WeatherResponse {
    timeSeries: TimeSeriesEntry[];
}

interface TimeSeriesEntry {
    validTime: string;
    parameters: Parameter[];
}

interface Parameter {
    name: string;
    values: number[];
}

interface ForecastDay {
    date: string;
    data: TimeSeriesEntry[]
}

interface RecentLocation {
    name: string;
    coords: string;
}

const locationSelect = document.getElementById("location") as HTMLSelectElement;
const getWeatherButton = document.getElementById("getWeather") as HTMLButtonElement;
const weatherDisplay = document.getElementById("weatherDisplay") as HTMLDivElement;

// SMHI API precipitation categories
const getPrecipitationCategory = (category?: number): string => {
    if (category === undefined) return "Unknown";
    switch (category) {
        case 0: return "No Precipitation";
        case 1: return "Light Precipitation";
        case 2: return "Moderate Precipitation";
        case 3: return "Heavy Precipitation";
        case 4: return "Very Heavy Precipitation";
        default: return "Unknown";
    }
};

// SMHI API precipitation types
const getPrecipitationType = (pcat?: number): string => {
    if (pcat === undefined) return "None";
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

const fetchFiveDayForecast = async (latitude: number, longitude: number, resortName: string): Promise<void> => {
    const apiUrl = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${longitude}/lat/${latitude}/data.json`;

    try {
        const response: Response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data: WeatherResponse = await response.json();
        weatherDisplay.innerHTML = "";

        const resortTitle: HTMLHeadingElement = document.createElement('h3');
        resortTitle.textContent = `Weather Forecast for ${resortName}`;
        weatherDisplay.appendChild(resortTitle);

        const fiveDayForecast: Record<string, TimeSeriesEntry[]> = {};
        data.timeSeries.forEach(entry => {
            const validDate: string = new Date(entry.validTime).toISOString().split('T')[0];
            if (!fiveDayForecast[validDate]) {
                fiveDayForecast[validDate] = [];
            }
            fiveDayForecast[validDate].push(entry);
        });

        const today: Date = new Date();

        const forecastDays: ForecastDay[] = [];
        for (let i = 0; i < 5; i++) {
            const forecastDate: Date = new Date(today);
            forecastDate.setDate(today.getDate() + i);
            const dateString: string = forecastDate.toISOString().split('T')[0];

            if (fiveDayForecast[dateString]) {
                forecastDays.push({ date: dateString, data: fiveDayForecast[dateString] });
            }
        }

        const forecastContainer: HTMLDivElement = document.createElement('div');
        forecastContainer.className = 'forecast-row';

        forecastDays.forEach(day => {
            const dayData: TimeSeriesEntry[] = day.data;

            const parameters: Parameter[] = dayData[0].parameters;

            const temperatureMean: number | "N/A" = parameters.find(param => param.name === "t")?.values[0] ?? "N/A";
            const humidity: number | "N/A" = parameters.find(param => param.name === "r")?.values[0] ?? "N/A";
            const precipitationAmount: number | "N/A" = parameters.find(param => param.name === "pmax")?.values[0] ?? "N/A";

            const pcatValue: number | undefined = parameters.find(param => param.name === "pcat")?.values[0];
            const precipitationCategory: string = getPrecipitationCategory(pcatValue);
            const precipitationType: string = getPrecipitationType(pcatValue);

            const windSpeed: number | "N/A" = parameters.find(param => param.name === "ws")?.values[0] ?? "N/A";
            const windGustSpeed: number | "N/A" = parameters.find(param => param.name === "gust")?.values[0] ?? "N/A";
            const windDirection: number | "N/A" = parameters.find(param => param.name === "wd")?.values[0] ?? "N/A";

            const dayElement: HTMLDivElement = document.createElement('div');
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
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching weather data:", error.message);
            weatherDisplay.innerHTML = `<p>Error fetching weather data: ${error.message}</p>`;
        } else {
            console.error("Unexpected error:", error);
            weatherDisplay.innerHTML = `<p>An unexpected error occurred while fetching weather data.</p>`;
        }
    }
};

const displayHourlyForecast = (dayData: TimeSeriesEntry[], _date: string): void => {
    const existingHourly: Element | null = document.querySelector('.hourly-forecast');
    if (existingHourly) {
        existingHourly.remove();
    }

    const hourlyForecastContainer: HTMLDivElement = document.createElement('div');
    hourlyForecastContainer.className = 'hourly-forecast forecast-row';

    dayData.forEach(entry => {
        const validTime: Date = new Date(entry.validTime);
        const hourString: string = validTime.toISOString().split('T')[1].substring(0, 5);

        const parameters: Parameter[] = entry.parameters;
        const temperature: number | "N/A" = parameters.find(param => param.name === "t")?.values[0] ?? "N/A";
        const humidity: number | "N/A" = parameters.find(param => param.name === "r")?.values[0] ?? "N/A";
        const precipitationAmount: number | "N/A" = parameters.find(param => param.name === "pmax")?.values[0] ?? "N/A";
        const pcatValue: number | undefined = parameters.find(param => param.name === "pcat")?.values[0];
        const precipitationType: string = getPrecipitationType(pcatValue);
        const windSpeed: number | "N/A" = parameters.find(param => param.name === "ws")?.values[0] ?? "N/A";
        const windGustSpeed: number | "N/A" = parameters.find(param => param.name === "gust")?.values[0] ?? "N/A";
        const windDirection: number | "N/A" = parameters.find(param => param.name === "wd")?.values[0] ?? "N/A";

        const hourElement: HTMLDivElement = document.createElement('div');
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

//sparar option val i localstorage
const saveRecentLocation = (name: string, coords: string) => {
    let recentLocations = JSON.parse(localStorage.getItem('recentLocations') || '[]') as RecentLocation[];

    recentLocations = recentLocations.filter((location: RecentLocation) => location.coords !== coords);

    recentLocations.push({ name, coords });

    if (recentLocations.length > 5) {
        recentLocations.shift(); // shift tar bort den äldsta
    }

    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));

    renderRecentLocations();
};

const renderRecentLocations = () => {
    const recentLocations = JSON.parse(localStorage.getItem('recentLocations') || '[]') as RecentLocation[];
    const recentLocationsContainer = document.getElementById('recentLocationsContainer') as HTMLDivElement;

    recentLocationsContainer.innerHTML = '';

    const heading: HTMLHeadingElement = document.createElement('h2');
    heading.textContent = 'Recently Viewed';
    recentLocationsContainer.appendChild(heading);

    recentLocations.forEach(location => {
        const option: HTMLOptionElement = document.createElement('option');
        option.value = location.coords;
        option.textContent = location.name;

        option.addEventListener('click', () => {
            const selectedLocation: string[] = location.coords.split(',');
            const latitude: number = parseFloat(selectedLocation[0]);
            const longitude: number = parseFloat(selectedLocation[1]);

            const resortName: string = location.name;

            fetchFiveDayForecast(latitude, longitude, resortName);
        });

        recentLocationsContainer.appendChild(option);
    });
};

getWeatherButton.addEventListener("click", () => {
    const selectedLocation: string[] = locationSelect.value.split(',');
    const latitude: number = parseFloat(selectedLocation[0]);
    const longitude: number = parseFloat(selectedLocation[1]);
    const resortName: string = locationSelect.options[locationSelect.selectedIndex].text;
    fetchFiveDayForecast(latitude, longitude, resortName);
    
});

locationSelect.addEventListener("change", () => {
    const selectedOption : HTMLOptionElement = locationSelect.options[locationSelect.selectedIndex];
    const coords : string = selectedOption.value;
    const name : string = selectedOption.textContent || '';

    saveRecentLocation(name, coords);
});

document.addEventListener('DOMContentLoaded', () => {
    renderRecentLocations();
});