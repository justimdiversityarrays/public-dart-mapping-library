# mapping-library

Intended to be imported into a flask app into a jinja2 template to enable mapping on a web front end using mapbox.

## Getting started

You need the following .css and .js 

```
<script src='https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.css' rel='stylesheet' />

{# TODO add the moudles imported by map_import via NPM #}
<script src="/static/js/map_import.js" type="module"></script>
{# If using jinja2 templaes you can use the following format #}
{# <script src="{{ url_for('static', filename='js/map_import.js') }}" type="module"></script> #}

<!-- Local JS and CSS -->
<link rel="stylesheet" href="/static/css/mapboxcontrol.css">
<script src="/static/js/map_all.js"></script>

<!-- Set up a map div-->
<style>
body { margin: 10; padding: 10; }
#map { min-height:800px; max-width:1200px }
</style>
<div id='map-display' class="row ">
    <div id='map'></div>
    <div id='map-popup' class="mapboxgl " style="display:block;">
    </div>
</div>

<script>
sc
  const mapSelector = 'map'
  const map = new DartMap(mapSelector)

    // Replace url_array with the actual API endpoints
const url_array =[
    `http://localhost/api/v2/map/trap/${inputValue}`,
    `http://localhost/api/v2/map/survey/${inputValue}`,
    `http://localhost/api/v2/map/field/${inputValue}`
    ]

// This is a backdoor key, the actual method of authenticating for the API should be more robust and not have backdoor codes stored in the code
var headers = new Headers();
headers.set('ecollectbackdoor', 'localdev');

// Example request options for the fetch function
var temp_requestOptions = {
method: 'GET',
headers: headers,
};

/**
* The application must submit a function that retrieves the correctly Formatted Geojson from a fetch response and return it.
* @param {String} response will be provided to this function from the response to the API URL
* @returns {Object} geojson a properly formatted for mapbox geojson json object
*/
function getGeojsonFromResponse(response) {
    return response.json().then(data => data.result.geojson)
}

/**
* The application must submit a function that retrieves the Total Pages from a fetch response and return it.
* @param {String} response will be provided to this function from the response to the API URL
* @returns {Integer} total_pages from the API response so that we can paginate 
*/
function getTotalpagesFromResponse(response) {
    return response.json().then(data => data.info.total_pages)
}

/**
* The application must submit a function that posts and formats the URL for the fetch function
* @param {String} url to be posted to the function e.g 'https://devtest.eco1dart.com//api/v2/map/field/1''
* @param {Integer} pagelength desired pagelength, 
* @param {Integer} page number, applicantion should leave this blank, it is provided to the function by other functions.
* @returns {String} tmp_url correctoly formatted url based on the API being used
*/
function postUrlToMethod(url, pagelength, page=0) {
    return tmp_url = url + "?" + new URLSearchParams({_pagelength: pagelength, _page: page}).toString()
}

// Loop through the url_array, you could change this to just have 1 URL in the array or remove the array and just submit 1 URL
for (var url of url_array){
    /**
    * The application must now pass some variables and functions to the paginatedApi() method 
    * @param {String} url to be posted to the function e.g 'https://devtest.eco1dart.com//api/v2/map/field/1''
    * @param {Integer} pagelength desired pagelength
    * @param {Object} requestOptions request options for the fetch function, example above
    * @param {Function} getGeojsonFromResponse function that retrieves the correctly Formatted Geojson from a fetch response and return it.
    * @param {Function} getTotalpagesFromResponse function that retrieves the Total Pages from a fetch response and return it.
    * @param {Function} postUrlToMethod function that posts and formats the URL for the fetch function
    * @returns {Function} the returned wrapped function has parameteres and functions passed through to paginatedApi() which 
    * @returns {Integer} tmp_url correctoly formatted url based on the API being used
    */
    const [ theMethod, theMethodTotalPages] = await map.paginatedApi(
        url,
        1000,
        temp_requestOptions,
        getGeojsonFromResponse,
        getTotalpagesFromResponse,
        postUrlToMethod
        )
    
    // Paginating API requests and running 
    map.load_from_paginated(theMethod, theMethodTotalPages)
}

</script>
```