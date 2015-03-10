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

function url(week, day) {
  return 'http://dining.guckenheimer.com/clients/mozilla/fss/fss.nsf/weeklyMenuLaunch/9QBSJJ~' + week + '/$file/day' + day + '.htm';
}

function getWeek() {
  var today = new Date();
  if (today.getHours() > 0) {
    today.setDate(today.getDate() + 1);
  }
  if (today.getDay() > 4) {
    today.setDate(today.getDate() + 7);
  }
  while(today.getDay() != 1) {
    today.setDate(today.getDate() - 1);
  }
  var d = ('0' + today.getDate()).substr(-2);
  var m = ('0' + (today.getMonth() + 1)).substr(-2);
  var y = today.getFullYear();
  return m + '-' + d + '-' + y;
}


function updateMenu() {
  var today = new Date();
  var week = getWeek();
  var currentDay = today.getDay();
  request(url(week, currentDay), function (err, res, body) {
    if (!err) {
      menu.today = renderMenu(body);
    }
    request(url(week, currentDay+1), function (err, res, body) {
      if (!err) {
        menu.tomorrow = renderMenu(body);
      }
    });
  });
}

setInterval(updateMenu, 1000 * 60 * 15);

function renderMenu(body) {
  var $ = cheerio.load(body);
  var headers = $('#center_text > div[style]');
  var items = $('#center_text > div[style] + div');
  var o = {};
  for (var i = 0; i < headers.length; i++) {
    o[headers.eq(i).text()] = items.eq(i).text();
  }
  return o;
}

updateMenu();

server.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
