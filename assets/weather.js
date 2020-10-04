const API_KEY = '627ac73dd5336536d7552227e89866de';

$(document).ready(() => {
    searchHistory.render();
    currentWeather.fetch();
});

let currentWeather = {
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

    fetch() {
        $.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${API_KEY}&units=imperial`)
            .then(res => {
                $.get(`https://api.openweathermap.org/data/2.5/uvi?lat=${res.coord.lat}&lon=${res.coord.lon}&appid=${API_KEY}`)
                    .then(res => {
                        this.uvIndex = res.value;
                        this.render();
                    });

                this.temp = res.main.temp;
                this.humidity = res.main.humidity;
                this.windSpeed = res.wind.speed;
                this.render();
            });
    },

    render() {
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
            .append(
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
                        .on('click', e => currentWeather.city = city)
                )
            );
    }
}

$('form#city-search button[type="submit"]').on('click', function (e) {
    e.preventDefault();
    let inputCity = $('#input-city').val();
    if (inputCity !== '') {
        searchHistory.addCity(inputCity);
        currentWeather.city = inputCity;
        $('#input-city').val('');
    }
});