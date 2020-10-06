const API_KEY = '627ac73dd5336536d7552227e89866de';

$(document).ready(() => {
    searchHistory.render();
    weather.fetch();
});

let weather = {
    _city: '',
    date: new Date(),
    temp: null,
    humidity: null,
    windSpeed: null,
    uvIndex: null,
    card: $('#current-weather>.card-body'),

    get city() {
        return this._city;
    },

    set city(newCity) {
        this._city = newCity;
        this.fetch();
    },

    async fetch() {
        let { coord } = await $.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${API_KEY}`)
        $.get(`https://api.openweathermap.org/data/2.5/onecall?lon=${coord.lon}&lat=${coord.lat}&exclude=minutely,hourly,alerts&units=imperial&appid=${API_KEY}`)
            .then(res => {
                this.temp = res.current.temp;
                this.humidity = res.current.humidity;
                this.windSpeed = res.current.wind_speed;
                this.uvIndex = res.current.uvi;
                this.renderCurrent();
            });
    },

    renderCurrent() {
        this.card.children('.card-title')
            .text(this.city);
        this._renderTemp();
        this._renderHumidity();
        this._renderWindSpeed();
        this._renderUvIndex();
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
    }
}

let searchHistory = {
    cities: [],

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