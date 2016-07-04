
var longonot = require('./lib/scrape');


var url = 'https://www.npmjs.com/browse/depended?offset={{page}}';

var selectors = {

  //using the quick "select" method with "text" argument
  'name' : function(){ return longonot.select('.package-widget a.name','text'); },
  //"text" argument is the default. Other values include "number" & "html"
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

var filename = 'most depended-upon packages';


longonot.scrape(url, pages, selectors /*, [filename] if set, then the data is saved as a csv file in filename.zip */ )
  .then(function(data){
    console.log(JSON.stringify(data,0,4));
  })
  .catch(function(err){
    console.log(err);
  });
