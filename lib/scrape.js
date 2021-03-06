//jshint -W119

var async = require('async');
var _ = require('lodash');
var unirest = require('unirest');
var cheerio = require('cheerio');
var arrify = require('arrify');
var random_ua = require('random-ua');
var path = require('path');
var S = require('string');
var csv_export=require('csv-export');
var mkdirp = require('mkdirp');
var sanitize = require("sanitize-filename");
var numeral = require('numeral');

var fs = require('fs');
noDDOSWait = 5000;

var f = path.join( __dirname,'..','f.json' );
var dataDir = path.join( __dirname,'..','data' );

//create data directory
mkdirp.sync(dataDir);

//exports
module.exports = {
  scrape: scrape,
  select : select,
  sanitizeStr: sanitizeStr,
  sanitizeNum: sanitizeNum
};


function select($, selector, type ){

  type = type || 'text';

  var data = [];
  $(selector).each(function(){
    var el = $(this);
    var val = null;

    if(type=='text'){ val = sanitizeStr( el.text() ); }
    else if(type=='number'){ val = sanitizeNum( el.text() ); }
    else if(type=='html'){ val = el.html(); }
    else{ val = el.attr(type);}

    data.push( val );

  });

  return data;
}


function scrape( url, pages, data, fileName ){

  var pages_arr = null;
  // pages = _.range(1,pages);
  if(_.isArray(url)){
    pages_arr = url;
  }
  else{
    pages_arr = _.range(pages.start||0, pages.end||1, pages.step+1||1 );
  }


  if( pages.end && (last = Number(pages.end)+1) && _.last(pages_arr) < last ){
    pages_arr.push(last);
  }

  // console.log(pages_arr);
  selectors = data || {};

  var _dataZip = null;
  if(fileName){
    _dataZip =  path.join(path.dirname(fileName),   sanitize(path.basename(fileName).trim().replace(/\s+/g,'_')) );
  }

  return new Promise (function(resolve,reject){

    var urls =  url ;
    if(typeof url == 'string'){
      urls = _.map( pages_arr, p => url.replace(/{{page}}/i,p) );
    }

    // urls = urls.slice(0,2);
    // console.log(urls);

    fetch( urls, selectors, _dataZip )
      .then(extract)
      .then(saveData)
      .then(resolve)
      .catch(function(err){
        reject(err);
      });

  });
}

function saveData(res){

  var data = res.data;
  var dataZip = res.dataZip;

  return new Promise (function(resolve,reject){

    if(!dataZip){
      return resolve(data);
    }

    dataZip = /\.zip$/.test(dataZip)? dataZip : dataZip+'.zip' ;
    // console.log(dataZip);

    csv_export.export(data, function(buffer){
      //this module returns a buffer for the csv files already compressed into a single zip.
      //save the zip or force file download via express or other server
      fs.writeFileSync( dataZip, buffer );
    });

    resolve({ file: dataZip , url: dataZip });

  });

}

function extract(res){
  // console.log(res);
  var results = res.results;
  var selectors = res.selectors;

  return new Promise (function(resolve,reject){

    var data = [];

    async.eachLimit(results, 1, function(res, next){

      var $ = cheerio.load(res);
      var extracted = {};

      _.each(selectors, function(func, key){
        // console.log(key);
        extracted[key] = func($);
      });

      //attempt to merge results...
      var arr = arrify(_.first(_.values(extracted)));
      var keys = _.keys(extracted);
      var merged = {};


      _.each(arr, function(val, i){

        _.each(keys, function(key){
          merged[i] = merged[i] || {};
          merged[i][key] = extracted[key][i] || null;
        });

      });

      merged = _.values(merged);
      //resolve
      data = _.union( data, merged  );
      // resolve( );
      next();

    }, function(){

      resolve({
        data : data,
        dataZip : res.dataZip
      });

    });

  });

}

function sanitizeNum(str){
  str = sanitizeStr(str);
  str = str.replace(/[^0-9,\.\-]/,'');

  return numeral().unformat(str);
}

function sanitizeStr(str){
  str = S(str)
          .decodeHTMLEntities()
          .collapseWhitespace()
          .trim()
          .s;

  return str;
}

function fetch( urls, selectors, dataZip ){

  return new Promise(function( resolve, reject ){

    var results = {};

    async.eachLimit(urls, 50, function(url,nextURL){
      // console.log(url);

      unirest.get(url)
      .headers({'User-Agent': random_ua.generate() })
      .end(function (response) {
        // console.log(response)
        //if response is 200
        if(response.status == 200){ results[url] = response.body; }

        //wait a few seconds...scraping should not cause any DOS
        setTimeout(function(){
          //next URL
          nextURL();
        }, noDDOSWait );


      });

    }, function(){

      resolve({ results, selectors, dataZip });

    });
  });

}
