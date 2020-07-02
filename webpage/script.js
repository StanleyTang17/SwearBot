var title = document.querySelector('h1');
var btn = document.getElementById('btn_submit');
var id_text = document.getElementById('discord_id');
var select = document.getElementById('guild_select');
var graph_container = document.getElementById('graph_container');
var quote_container = document.getElementById('quote_container');
var graphs = new Map();
var quote_groups = new Map();
var guild_profiles;

title.style.display = 'none';
select.style.display = 'none';
graph_container.style.display = 'none';

select.addEventListener('change', () => {
    for(var key in graphs) {
        graphs[key].style.display = 'none';
        quote_groups[key].style.display = 'none';
    }
    graphs[select.value].style.display = 'block';
    quote_groups[select.value].style.display = 'block';
});

btn.addEventListener('click', () => {
    var id = id_text.value;
    var url = 'http://localhost:3000/user?id=' + id;
    fetch(url).then(response => response.json()).then(data => {
        if(data) {
            document.getElementById("title").innerHTML = data.username + "'s Swearing Profile";

            select.innerHTML = '';
            guild_profiles = data.guilds;
            guild_profiles.forEach(guild_data => {
                var guild_name = guild_data.guild_name;
                var option = document.createElement('option');
                option.setAttribute('value', guild_name);
                var text = document.createTextNode(guild_name);
                option.appendChild(text);
                select.appendChild(option);

                var canvas = document.createElement('canvas');
                createChart(canvas.getContext('2d'), guild_data);
                canvas.style.display = 'none';
                graph_container.appendChild(canvas);
                graphs[guild_name] = canvas;

                var quote_group = document.createElement('div');
                guild_data.swear_quotes.forEach(quote => {
                    var div_quote = document.createElement('div');
                    var date = new Date(quote.date);
                    var year = date.getFullYear();
                    var month = date.getMonth() + 1;
                    var day = date.getDate();

                    var h6_date = document.createElement('h6');
                    h6_date.innerHTML = `${year}/${month >= 10 ? month : '0'+month}/${day}`;

                    var p_quote = document.createElement('p');
                    p_quote.innerHTML = quote.content;
                    
                    div_quote.appendChild(h6_date);
                    div_quote.appendChild(p_quote);
                    if(quote_group.children.length > 0)
                        div_quote.setAttribute('id', 'div_quote');

                    quote_group.appendChild(div_quote);
                });
                
                quote_group.style.display = 'none';
                quote_container.appendChild(quote_group);
                quote_groups[guild_name] = quote_group;
            });

            var first_guild = guild_profiles[0].guild_name;
            graphs[first_guild].style.display = 'block';
            quote_groups[first_guild].style.display = 'block';
            title.style.display = 'block';
            select.style.display = 'block';
            graph_container.style.display = 'block';
            document.querySelector('section').style.display = 'none';
        }
    });
});

function createChart(ctx, guild_data) {
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
            responsive : true,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function addDays(date, days) {
    var newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}

function parseLabel(date) {
    return (date.getMonth()+1) + '-' + date.getDate();
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