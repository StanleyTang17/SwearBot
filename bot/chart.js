const Canvas = require('canvas');

function addDays(date, days) {
    var newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}

function parseLabel(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return (month > 9 ? month : '0'+month) + '/' + (day > 9 ? day : '0'+day) + '/' + date.getFullYear();
}

function compareDate(date1, date2) {
    if(date1.getFullYear() === date2.getFullYear()) {
        if(date1.getMonth() === date2.getMonth()) {
            if(date1.getDate() === date2.getDate()) {
                return 0;
            }else {
                return date1.getDate() - date2.getDate();
            }
        }else {
            return date1.getMonth() - date2.getMonth();
        }
    }else {
        return date1.getFullYear() - date2.getFullYear();
    }
}


//Chart.js method

const Chart = require('chart.js');
function generate(guild_data) {
    const canvas = Canvas.createCanvas(900, 500);
    const ctx = canvas.getContext('2d');
    var dataMap = new Map();
    var quotes = guild_data.swear_quotes;
    var maxDate = new Date(Date.now());
    var minDate = addDays(maxDate, -30);
    
    for(var i = 0; i < quotes.length; i++) {
        const date = new Date(quotes[i].date);
        if(compareDate(date, minDate) >= 0) {
            minDate = date;
            break;
        }
    }

    var newDate = new Date(minDate);
    while(compareDate(newDate, maxDate) <= 0) {
        dataMap.set(parseLabel(newDate), 0);
        newDate = addDays(newDate, 1);
    }

    for(var i = quotes.length - 1; i > -1; i--) {
        const quote = quotes[i];
        const date = new Date(quote.date);
        if(compareDate(date, minDate) < 0) break;
        const label = parseLabel(date);
        dataMap.set(label, dataMap.get(label) + quote.usage);
    }

    var date_labels = [];
    var swear_usages = [];
    dataMap.forEach((value, key, map) => {
        date_labels.push(key);
        swear_usages.push(value);
    })

    var graph = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: date_labels,
            datasets: [{
                label: 'swear usage',
                data: swear_usages,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive : false,
            animation : false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    return canvas;
}

module.exports.generate = generate;


//matplotlib method (doesn't work on heroku)
/*
function getData(user_data) {
    var dataMap = new Map();
    var quotes = user_data.swear_quotes;
    var maxDate = new Date(Date.now());
    var minDate = addDays(maxDate, -30);
    
    for(var i = 0; i < quotes.length; i++) {
        const date = new Date(quotes[i].date);
        if(compareDate(date, minDate) >= 0) {
            minDate = date;
            break;
        }
    }

    var newDate = new Date(minDate);
    while(compareDate(newDate, maxDate) <= 0) {
        dataMap.set(parseLabel(newDate), 0);
        newDate = addDays(newDate, 1);
    }

    for(var i = quotes.length - 1; i > -1; i--) {
        const quote = quotes[i];
        const date = new Date(quote.date);
        if(compareDate(date, minDate) < 0) break;
        const label = parseLabel(date);
        dataMap.set(label, dataMap.get(label) + quote.usage);
    }

    var date_labels = [];
    var swear_usages = [];
    dataMap.forEach((value, key, map) => {
        date_labels.push(key);
        swear_usages.push(value);
    })

    var result = {
        date_labels : date_labels,
        swear_usages : swear_usages
    };

    return result;
}

module.exports = {
    getChartData : user_data => {
        const data = getData(user_data);
        const filename = user_data.name + "_" + user_data.guild_id + "_" + user_data.discord_id;
        const result = {
            filename : filename,
            path : "/tmp/" + filename + ".png",
            x_data_str : data.date_labels.join(','),
            y_data_str : data.swear_usages.join(',')
        };
        return result;
    }
}
*/