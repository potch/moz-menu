var cheerio = require('cheerio');
var express = require('express');
var http = require('http');
var request = require('request');

var menu = {};

var app = express();
app.set('port', (process.env.PORT || 8000));
app.use(express.static(__dirname + '/static'));
var server = http.createServer(app);

app.get('/', function(req, res) {
  res.redirect('/index.html');
});

app.get('/menu', function (req, res) {
  res.json(menu);
});

var dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function url(d) {
  var day = d.getDay();
  var week = getWeek(d);
  return 'http://dining.guckenheimer.com/clients/mozilla/fss/fss.nsf/weeklyMenuLaunch/9QBSJJ~' + week + '/$file/' + dayNames[day] + '.htm';
}

function getWeek(date) {
  date = new Date(date.getTime());
  while(date.getDay() != 1) {
    date.setDate(date.getDate() - 1);
  }
  var d = ('0' + date.getDate()).substr(-2);
  var m = ('0' + (date.getMonth() + 1)).substr(-2);
  var y = date.getFullYear();
  return m + '-' + d + '-' + y;
}

function getToday() {
  var d = new Date();
  d.setHours(d.getHours() - 8);
  return d;
}

function getTomorrow() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(d.getHours() - 8);
  if (d.getDay() > 5) {
    while(d.getDay() != 1) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

function updateMenu() {
  var today = getToday();
  var tomorrow = getTomorrow();
  getMenu(today, function (m) {
    menu.today = {
      date: today.getTime(),
      menu: m
    };
    console.log(m);
  });
  getMenu(tomorrow, function (m) {
    menu.tomorrow = {
      date: tomorrow.getTime(),
      menu: m
    };
  });
}

setInterval(updateMenu, 1000 * 60 * 15);

function getMenu(d, cb) {
  if (d.getDay() === 5) {
    cb({
      'ENTREE': 'Pizza and Wings!',
      'VEGETARIAN ENTREE': 'Pizza and Expanded Salad Bar'
    });
  } else {
    request(url(d), function (err, res, body) {
      if (err) {
        console.error('error', err);
        return;
      }
      cb(parseMenu(body));
    });
  }
}

function parseMenu(body) {
  var $ = cheerio.load(body);
  var headers = $('span[style]');
  var items = $('span[style] + br + span');
  var o = {};
  for (var i = 0; i < headers.length; i++) {
    console.log(headers.eq(i).html(), items.eq(i).html());
    o[headers.eq(i).text()] = items.eq(i).text();
  }
  if (Object.keys(o).length === 0) {
    console.warn('no menu data found!');
  }
  return o;
}

updateMenu();

server.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
