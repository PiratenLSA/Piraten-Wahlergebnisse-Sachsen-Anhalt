/**
 * Piraten Wahlergebnisse Sachsen-Anhalt
 * Copyright (C) 2011 Christoph Giesel
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var http = require('http'),
  sys = require('sys'),
  fs = require('fs'),
  im = require('imagemagick'),
  ejs = require('ejs');

var tpl = fs.readFileSync(__dirname + '/wahlergebnisse.ejs', 'utf8');

var such1 = /<tr><td class=\"g\" colspan=\"2\">&nbsp;PIRATEN          <\/td>([\s\S]+?)<\/tr>/,
  such2 = /<td class=\"w\">([\s\S]*?)<\/td>/m,
  such3 = /<tr><th colspan=\"6\"><b>Zweitstimmen<\/b><\/t[rd]><\/tr>([\s\S]+?)<table/,
  such4 = /<tr><td class=\"g\" colspan=\"2\">&nbsp;(.+?)<\/td>([\s\S]+?)<\/tr>/g,
  such5 = /<tr><td colspan=\"6\" class=\"g\">&nbsp;davon f�r<\/td><\/tr>([\s\S]+?)<tr><td class=\"g\" colspan=\"2\">&nbsp;Andere<\/td>/,
  such6 = /<tr><td class=\"g\">&nbsp;PIRATEN <\/td><td class=\"g\">([\s\S]+?)<\/td>([\s\S]+?)<\/tr>/;

var wk = new Object();

for (var i = 1; i <= 45; i++) {
  var num = i.toString();
  
  if (num.length == 1) {
    num = '0' + num;
  }
  wk[num] = 0;
}

wk['md'] = 0;
wk['hal'] = 0;

var allp = new Object();

allp['cdu'] = 0;
allp['linke'] = 0;
allp['spd'] = 0;
allp['gruene'] = 0;
allp['fdp'] = 0;
allp['piraten'] = 0;
allp['fw'] = 0;
allp['npd'] = 0;
allp['rest'] = 0;

var dk = new Object();

dk['11'] = 0;
dk['36'] = 0;
dk['37'] = 0;
dk['38'] = 0;
dk['40'] = 0;

String.prototype.ltrim = function (clist) {
  if (clist)
    return this.replace (new RegExp ('^[' + clist + ']+'), '');
  return this.replace (/^\s+/, '');
}
String.prototype.rtrim = function (clist) {
  if (clist)
    return this.replace (new RegExp ('[' + clist + ']+$'), '');
  return this.replace (/\s+$/, '');
}
String.prototype.trim = function (clist) {
  if (clist)
    return this.ltrim (clist).rtrim (clist);
  return this.ltrim ().rtrim ();
}
String.prototype.contains = function (it) {
  return this.indexOf(it) != -1;
}

Number.prototype.round = function (stellen) {
  if (stellen) {
    var mult = Math.pow(10, stellen);
    return Math.round(this*mult)/mult;
  }
  
  return Math.round(this);
}

getFarbe = function (prozent) {
  if (prozent >= 3.4) {
    return '#000000';
  } else if (prozent >= 3.2) {
    return '#080062';
  } else if (prozent >= 3.0) {
    return '#0048ff';
  } else if (prozent >= 2.8) {
    return '#00a9ff';
  } else if (prozent >= 2.6) {
    return '#00d99d';
  } else if (prozent >= 2.4) {
    return '#00b900';
  } else if (prozent >= 2.2) {
    return '#81ff00';
  } else if (prozent >= 2.0) {
    return '#d2fe00';
  } else if (prozent >= 1.8) {
    return '#ffde00';
  } else if (prozent >= 1.6) {
    return '#ffb000';
  } else if (prozent >= 1.4) {
    return '#ff7e00';
  } else if (prozent >= 1.2) {
    return '#ff0004';
  } else if (prozent >= 1.0) {
    return '#ff00a4';
  } else if (prozent >= 0.8) {
    return '#ff8bfa';
  } else if (prozent >= 0.6) {
    return '#ffd2fd';
  } else {
    return '#FFFFFF';
  }
}

getPiratenProzente = function (wahlkreis) {
  wahlkreis = wahlkreis.toString();
  
  if (wahlkreis.length == 1) {
    wahlkreis = '0' + wahlkreis;
  }

  var options = {
    host: 'www.stala.sachsen-anhalt.de',
    port: 80,
    path: '/wahlen/lt11/erg/wkr/lt.'+wahlkreis+'.ergtab.frametab.html',
    method: 'GET'
  };
  
  var req = http.request(options, function(res) {
    var resBody = "";
    res.setEncoding('utf8');
    
    res.on('data', function (chunk) {
      resBody += chunk;
    });
    
    res.on("end", function() {
      var erg1 = such1.exec(resBody);
      if (erg1 == null) {
        console.log('NULL - Wahlkreis: ' + wahlkreis);
        return;
      }
      var erg1split = erg1[1].split('\n');
      var erg2 = such2.exec(erg1split[2]);
      var prozent = erg2[1].replace(',', '.').replace('&nbsp;', '').trim();
      
      if (isNaN(prozent) || prozent == null || prozent == '') {
        prozent = 0;
      }
      
      console.log('Wahlkreis ' + wahlkreis + ': ' + prozent);
      
      wk[wahlkreis] = prozent;
      
      if (wahlkreis == '10' || wahlkreis == '11' || wahlkreis == '12' || wahlkreis == '13') {
        wk['md'] = (parseFloat(wk['10']) + parseFloat(wk['11']) + parseFloat(wk['12']) + parseFloat(wk['13'])) / 4;
      } else if (wahlkreis == '36' || wahlkreis == '37' || wahlkreis == '38' || wahlkreis == '39') {
        wk['hal'] = (parseFloat(wk['36']) + parseFloat(wk['37']) + parseFloat(wk['38']) + parseFloat(wk['39'])) / 4;
      }
      
      if (wahlkreis == '11' || wahlkreis == '36' || wahlkreis == '37' || wahlkreis == '38' || wahlkreis == '40') {
        var erg5 = such5.exec(resBody);
        
        if (erg5 == null) {
          console.log('NULL DK - Wahlkreis: ' + wahlkreis);
          return;
        }
        
        var erg6 = such6.exec(erg5[1]);
        var erg6split = erg6[2].split('\n');
        var erg2b = such2.exec(erg6split[2]);
        
        var kprozent = erg2b[1].replace(',', '.').replace('&nbsp;', '').trim();
        
        if (isNaN(kprozent) || kprozent == null || kprozent == '') {
          kprozent = 0;
        } else {
          kprozent = parseFloat(kprozent).round(1);
        }
        
        console.log('Wahlkreis ' + wahlkreis + ' DK: ' + kprozent);
        
        dk[wahlkreis] = kprozent;
      }
    });
  });
  
  req.on('error', function(err) {
    console.log('unable to connect (Wahlkreis: '+wahlkreis+')');
  });

  req.end();
}

getAllProzente = function () {
  var options = {
    host: 'www.stala.sachsen-anhalt.de',
    port: 80,
    path: '/wahlen/lt11/erg/kreis/lt.15.ergtab.frametab.html',
    method: 'GET'
  };
  
  var req = http.request(options, function(res) {
    var resBody = "";
    res.setEncoding('utf8');
    
    res.on('data', function (chunk) {
      resBody += chunk;
    });
    
    res.on("end", function() {
      var erg3 = such3.exec(resBody);
      if (erg3 == null) {
        console.log('NULL - Gesamt');
        return;
      }
      
      var sonstige = 0;
      
      while(true) {
        var erg4 = such4.exec(erg3[1]);
        
        if (erg4 == null) break;
        
        var partei = erg4[1].trim();
        
        var erg4split = erg4[2].split('\n');
        var erg2 = such2.exec(erg4split[2]);
        var prozent = erg2[1].replace(',', '.').replace('&nbsp;', '').trim();
        
        if (isNaN(prozent) || prozent == null || prozent == '') {
          prozent = 0;
        } else {
          prozent = parseFloat(prozent);
        }

        if (partei.contains('CDU')) {
          allp['cdu'] = prozent.round(1);
        } else if (partei.contains('LINKE')) {
          allp['linke'] = prozent.round(1);
        } else if (partei.contains('SPD')) {
          allp['spd'] = prozent.round(1);
        } else if (partei.contains('FDP')) {
          allp['fdp'] = prozent.round(1);
        } else if (partei.contains('GR�NE')) {
          allp['gruene'] = prozent.round(1);
        } else if (partei.contains('PIRATEN')) {
          allp['piraten'] = prozent.round(1);
        } else if (partei.contains('FREIE')) {
          allp['fw'] = prozent.round(1);
        } else if (partei.contains('NPD')) {
          allp['npd'] = prozent.round(1);
        } else {
          sonstige += prozent;
        }
      }
      
      allp['rest'] = sonstige.round(1);
      
      genDia();
    });
  });
  
  req.on('error', function(err) {
    console.log('unable to connect (Gesamt)');
  });
  
  req.end();
}

genDia = function () {
  var date = new Date();
  var hours = date.getHours().toString();
  var minutes = date.getMinutes().toString();
  
  if (hours.length == 1) {
    hours = '0' + hours;
  }
  if (minutes.length == 1) {
    minutes = '0' + minutes;
  }
  
  var options = {
    host: 'chart.googleapis.com',
    port: 80,
    path: '/chart?chs=400x200&chd=t:'+allp['cdu']+','+allp['linke']+','+allp['spd']+','+allp['gruene']+','+allp['fdp']+','+allp['piraten']+','+allp['fw']+','+allp['npd']+','+allp['rest']+'&cht=bvs&chds=0,50&chxt=x,y&chxl=0:|CDU|Linke|SPD|Grüne|FDP|PIRATEN|FW|NPD|Sonstige|1:|0|10|20|30|40&chg=0,20&chbh=a,10&chtt=Aktueller+Stand+('+hours+':'+minutes+'+Uhr)&chco=000000|9A0057|FF0000|169700|FFFF00|FF8800|005FFF|4a0000|A6A6A6&chm=r,b5b5b5,0,0.095,0.105|N**,222222,0,-1,12&chxr=|0,0,40,10',
    method: 'GET'
  };
  
  var req = http.request(options, function (res) {
    res.setEncoding('binary');
    
    var downloadfile = fs.createWriteStream('wahlergebnis-diagramm.png', {'flags': 'w'});
    
    res.on('data', function (chunk) {
      downloadfile.write(chunk, encoding='binary');
    });
    
    res.on('end', function () {
      downloadfile.end();
      console.log('diagram saved!');
    });
  });
  
  req.on('error', function (err) {
    console.log('unable to connect (GOOGLE)');
  });

  req.end();
}

writecss = function () {
  var css = '';
  
  for (actwk in wk) {
    css += "#wk" + actwk + " { fill: " + getFarbe(wk[actwk]) + "; }\n";
    if (actwk == 'md' || actwk == 'hal') {
      console.log(actwk + ': ' + wk[actwk]);
    }
  }
  
  fs.writeFile('svg-stylesheet.css', css, function (err) {
    if (err) throw err;
    console.log('css saved!');
    
    im.convert(['-quality', '95', '-resize', 'x500', '-background', 'white', 'wahlkreise_lsa.svg', 'wahlkreise_lsa.jpg'], 
      function(err, stdout, stderr){
        if (err) {
          throw err;
        } else {
          console.log("'wahlkreise_lsa.jpg' created");
        }
      })
    
    im.convert(['-quality', '95', '-resize', '200', '-background', 'white', 'wahlkreise_magdeburg.svg', 'wahlkreise_magdeburg.jpg'], 
      function(err, stdout, stderr){
        if (err) {
          throw err;
        } else {
          console.log("'wahlkreise_magdeburg.jpg' created");
        }
      })
    
    im.convert(['-quality', '95', '-resize', '200', '-background', 'white', 'wahlkreise_halle.svg', 'wahlkreise_halle.jpg'], 
      function(err, stdout, stderr){
        if (err) {
          throw err;
        } else {
          console.log("'wahlkreise_halle.jpg' created");
        }
      })
  });
}

writehtml = function () {
  var html = ejs.render(tpl, {
    encoding: 'utf8',
    locals: {
      landesweit: allp['piraten'],
      wahlkreis11: dk['11'],
      wahlkreis36: dk['36'],
      wahlkreis37: dk['37'],
      wahlkreis38: dk['38'],
      wahlkreis40: dk['40']
    }
  });
  
  fs.writeFile('wahlergebnisse.html', html, function (err) {
    if (err) {
      throw err;
    } else {
        console.log('html saved!');
    }
  });
}

writeall = function () {
  writecss();
  writehtml();
}

start = function () {
  console.log('START')

  for (var i = 1; i <= 45; i++) {
    getPiratenProzente(i);
    setInterval(getPiratenProzente, 1000*60*5, i);
  }
  
  setTimeout(function () {
    writeall();
    setInterval(writeall, 1000*60*5);
  }, 1000*60);
  
  getAllProzente();
  
  setInterval(getAllProzente, 1000*60*5);
}

var starthours = 17;
var startminutes = 57;

var date = new Date();

if (date.getHours() > starthours || (date.getHours() == starthours && date.getMinutes() > startminutes)) {
  start();
} else {
  var wait = 1000 * 60 * ( (starthours - date.getHours()) * 60 + (startminutes - date.getMinutes()) )
  console.log('WAIT: ' + wait / 60000);
  setTimeout(start, wait);
}
