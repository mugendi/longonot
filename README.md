# longonot
Easy web scraper for structured data with ability to output to zipped csv file.

Longonot is never meant to be (and will never be) a full fledged scraper. In fact, Longonot will perform rather badly with poorly structured data/html.

Longonot is created purposely to quickly scrape data from HTML pages where such data follows a given structure e.g. tables, lists e.t.c

## Start

```npm install --save longonot```

### Some Code

```javascript

var longonot = require('longonot');


var url = 'https://www.npmjs.com/browse/depended?offset={{page}}';

var selectors = {

  //using the quick "select" method with "text" argument
  'name' : function(){ return longonot.select('.package-widget a.name','text'); },
  //"text" argument is the default. Other values include "number" & "html"
  //any other value other than text, number and html is treated as an attribute and the attribute is returned instead
  'version' : function(){ return longonot.select('.package-widget a.version'); },
  //alternatively, we can us the cheerio object passed to function to customize data selectors
  'description' : function($){
    //start with empty array
    var dataArray = [];
    //select our elements & loop
    $('.package-widget p.description').each(function(){
      //use "sanitizeStr" method to clean string
      var val = longonot.sanitizeStr( $(this).text() );
      //add to array
      dataArray.push(val);
    });

    //return array
    return dataArray;
  }

};

//tell longonot what our pagination looks like
var pages = {
  start : 0, //what's the first page (default = 1)
  end: 100, //and what about the last page (default = 1)
  step: 32 //what's our step value (default = 1)
}

//filename to save the data
var filename = 'most depended-upon packages';


longonot.scrape(url, pages, selectors /*, [filename] if set, then the data is saved as a csv file in filename.zip */ )
  .then(function(data){
    console.log(JSON.stringify(data,0,4));
  })
  .catch(function(err){
    console.log(err);
  });

```

## API

### .scrape(url,pages, selectors, [filename] );
This is the main function called. Returns a promise.
### .sanitizeNum(string)
Used to clean up HTML strings.
### .sanitizeStr(string)
Used to clean up numerals from HTML strings.
### .select(CSS_selector)
Easy way to select data by passing a CCS selector like ".div a"
