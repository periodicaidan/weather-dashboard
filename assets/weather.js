const API_KEY = '627ac73dd5336536d7552227e89866de';
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_ENDPOINT = `${OPENWEATHER_URL}/weather?appid=${API_KEY}`;
const ONECALL_ENDPOINT = `${OPENWEATHER_URL}/onecall?appid=${API_KEY}`;

let weather = {
    _city: '',
    // TODO: This need not be state tbh
    date: new Date(),
    temp: null,
    humidity: null,
    windSpeed: null,
    uvIndex: null,
    iconId: null,
    card: $('#current-weather>.card-body'),

    get city() {
        return this._city;
    },

    set city(newCity) {
        this._city = newCity;
        this.fetch();
    },

    async fetch() {
        let { coord } = await $.get(`${WEATHER_ENDPOINT}&q=${this.city}`)
        $.get(`${ONECALL_ENDPOINT}&lon=${coord.lon}&lat=${coord.lat}&exclude=minutely,hourly,alerts&units=imperial`)
            .then(res => {
                this.temp = res.current.temp;
                this.humidity = res.current.humidity;
                this.windSpeed = res.current.wind_speed;
                this.uvIndex = res.current.uvi;
                this.iconId = res.current.weather[0].icon;
                this.renderCurrent();
                this.renderForecast(res.daily);
            });
    },

    renderCurrent() {
        this.card.children('.card-title')
            .text(`${this.city} (${this.date.toLocaleDateString()})`)
            .append($('<img>').attr('src', `http://openweathermap.org/img/wn/${this.iconId}.png`));
        this._renderTemp();
        this._renderHumidity();
        this._renderWindSpeed();
        this._renderUvIndex();
    },

    /**
     * 
     * @param {Array} forecast 
     */
    renderForecast(forecast) {
        $('.forecast').each((i, el) => {
            let dailyWeather = forecast[i];
            this._renderForecastCard($(el), dailyWeather);
        })
    },

    _uvIndexEvaluation() {
        if (this.uvIndex < 3) {
            return 'low';
        } else if (this.uvIndex < 6) {
            return 'medium';
        } else if (this.uvIndex < 8) {
            return 'high';
        } else if (this.uvIndex < 11) {
            return 'very-high';
        } else if (this.uvIndex >= 11) {
            return 'extreme';
        }
    },

    _renderTemp() {
        this.card.children('#temp')
            .text(`Temperature: ${this.temp} °F`);
    },

    _renderHumidity() {
        this.card.children('#humidity')
            .text(`Humidity: ${this.humidity}%`);
    },

    _renderWindSpeed() {
        this.card.children('#wind-speed')
            .text(`Wind Speed: ${this.windSpeed} MPH`);
    },

    _renderUvIndex() {
        this.card.children('#uv-index')
            .empty()
            .append(
                'UV Index: ',
                $('<span>')
                    .addClass('badge')
                    .addClass(`uv-${this._uvIndexEvaluation()}`)
                    .text(this.uvIndex)
            )
    },

    _renderForecastCard(jqCard, dailyWeather) {
        jqCard.children('.forecast-date')
            .text((function() {
                let date = new Date();
                // dt is in seconds; Date.setTime expects milliseconds
                date.setTime(dailyWeather.dt * 1000);
                return date.toLocaleDateString();
            })());
        jqCard.children('.forecast-icon')
            .append(
                $('<img>')
                    .attr('src', `http://openweathermap.org/img/wn/${dailyWeather.weather[0].icon}@2x.png`)
            );
        jqCard.children('.forecast-temp')
            .text(`Temp: ${dailyWeather.temp.day} °F`);
        jqCard.children('.forecast-humidity')
            .text(`Humidity: ${dailyWeather.humidity}%`);
    }
}

let searchHistory = {
    cities: [],
    storageKey: 'weatherHistory',

    _enqueue(city) {
        this.cities.unshift(city);
    },

    _dequeue() {
        this.cities.pop();
    },

    addCity(city) {
        this._enqueue(city);
        this.cities.length > 8 && this._dequeue();
        this.render();
    },

    render() {
        $('#search-history')
            .empty()
            .append(
                this.cities.map(city => 
                    $('<button>')
                        .addClass('list-group-item list-group-item-action')
                        .addClass('city')
                        .text(city)
                        .on('click', e => weather.city = city)
                )
            );
    },

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cities));
    },

    load() {
        this.cities = JSON.parse(localStorage.getItem(this.storageKey)) ?? [];
    }
}

$('form#city-search button[type="submit"]').on('click', function (e) {
    e.preventDefault();
    let inputCity = $('#input-city').val();
    if (inputCity !== '') {
        searchHistory.addCity(inputCity);
        weather.city = inputCity;
        $('#input-city').val('');
    }
});

$(document).ready(() => {
    searchHistory.load();
    searchHistory.render();
    weather.fetch();
});

// Save search history to localStorage when window is closed or refreshed
// This is so saving is only done once; we only need to save the final state of 
// the search history, not any of its intermediate states
window.onunload = () => {
    searchHistory.save();
}

