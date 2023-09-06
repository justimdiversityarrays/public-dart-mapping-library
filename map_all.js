/**
 * All methods directly related to map functionality.
 *
 * Brenton Keats, 2023
 * Justin Millsteed, 2023
 */

/**
 * In your html/jinja2 page select the map div
 *
 * const mapbox_access_key = "your mapbox access key, should look something like pk.gGGHR4YTFBHGKMphdfshb2gFDjjgPsfb.6mWgdsbGFg"
 * const mapSelector = 'map'
 * const map = new DartMap(mapSelector)
 */
class DartMap {
    constructor (mapSelector) {
        setTimeout(() => {
            this.map = this.#setupMap(mapSelector)
        }, 500);
    }

    /**
     * Set up a map canvas
     * @param {String} mapId HTML element ID of div to configure as a map. Defaults to "map"
     * @returns {mapboxgl.Map} Mapbox Map object instance tied to `mapId` element.
     */
    #setupMap(mapId) {
        // Gets and Sets the access token
        mapboxgl.accessToken =  mapbox_access_key
        // Creates the featureless FeatureCollections that get used as an empty template for the draw function.
        var javascript_geojson  = {"type": "FeatureCollection", "features": [] };
        var javascript_survey_geojson = {"type": "FeatureCollection", "features": [] };

        // Creates the mapping Object with standard settings
        const map = new mapboxgl.Map({
            container: mapId, // container ID
            style: 'mapbox://styles/mapbox/satellite-streets-v11', // style URL
            zoom: 1 // starting zoom
        });

        // Adds the stand FullscreenControl feature to the map from the FullscreenControl library from mapbox.
        map.addControl(new mapboxgl.FullscreenControl());

        // TODO: Add NPM to Ecologue and add back the StylesControl and RulerControl libraries.
        // They were being added in via Skypack but adding them in as .js modules doesn't seem to work anymore.

        // with default styles:
        map.addControl(new StylesControl({
        styles: [
            {
            label: 'Streets',
            styleName: 'Mapbox Streets',
            styleUrl: 'mapbox://styles/mapbox/streets-v9',
            }, {
            label: 'Satellite Streets',
            styleName: 'Satellite Streets',
            styleUrl: 'mapbox://styles/mapbox/satellite-streets-v11',
            },
        ],
        onChange: (style) => console.log(style),
        }), 'bottom-left');

        map.addControl(new RulerControl(), 'bottom-right');
        map.on('ruler.on', () => console.log('%cruler.on', 'color: #3D5AFE'));
        map.on('ruler.off', () => console.log('%cruler.off', 'color: #3D5AFE'));
        map.on('ruler.change', (params) => {
        console.log('%cruler.change', 'color: #3D5AFE');
        console.table(params.coordinates);
        });

        // Adds the stand NavigationControl feature to the map from the NavigationControl library from mapbox.
        map.addControl(new mapboxgl.NavigationControl());

        // Adds the stand ScaleControl feature to the map from the ScaleControl library from mapbox.
        const scale = new mapboxgl.ScaleControl({
            maxWidth: 80,
            unit: 'metric'
        });
        map.addControl(scale);

        // Passes the map object, the javascript_geojson and javascript_survey_geojson geojson objects to the draw_map function
        // to setup how the map is drawn
        draw_map(map, javascript_geojson, javascript_survey_geojson)

        return map;
    }

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
    async paginatedApi(url, pagelength, requestOptions, getGeojsonFromResponse, getTotalpagesFromResponse, postUrlToMethod) {
        
        var temp_page = 1
        const tmp_url = postUrlToMethod(url, pagelength, temp_page=1)
        const req_total_pages = fetch(tmp_url, requestOptions).then(response => getTotalpagesFromResponse(response))

        async function wrapped(page) {
            console.log(requestOptions)
            const url_ = postUrlToMethod(url, pagelength, page=page)
            return await fetch(url_, requestOptions)
                .then(response => getGeojsonFromResponse(response))
        }
        
        const total_pages = await req_total_pages;
        return [ wrapped, total_pages, requestOptions]
    }
    /**
    * Function that adds geojson to the map it's called on
    * @param {Object} geojson properly formatted for mapbox geojson object
    */
    addGeojson(geojson) {
        if ( typeof geojson == 'string' ) {
            geojson = JSON.parse(geojson)
        }
        if (geojson.features[0]) {
            // Checks if the incompoint point data exsists, if it does gets the current data on the map,
            // adds to that current data and then sets the map to use that data.
            if (geojson.features[0].geometry.type === 'Point' ) {
                var current_point_data = this.map.getSource('DataPoints')._data
                geojson.features.forEach(function(feature) {
                    current_point_data.features.push(feature);
                });
                this.map.getSource('DataPoints').setData(current_point_data);
            } 
            
            // Checks if the incompoint line data exsists, if it does gets the current data on the map,
            // adds to that current data and then sets the map to use that data.
            if (geojson.features[0].geometry.type === 'LineString' || geojson.features[0].geometry.type === 'MultiLineString') {
                var current_survey_data = this.map.getSource('LineString')._data
                geojson.features.forEach(function(feature) {
                    current_survey_data.features.push(feature);
                });
                this.map.getSource('LineString').setData(current_survey_data);
            }
        }
    }

    /**
    * Function that adds fetches responses from an API based on the configured method provided to it
    * You must run paginatedApi() and provide its returned function and variable to this method.
    * @param {Function} getPage preconfigured function that gets the geojson response and formats the API's URL correctly for pagination
    * @param {Integer} total_pages required as a limit to making paginated requests.
    */
    async load_from_paginated(getPage, total_pages) {
        // get_page is a callable to fetch the next page of content. Should return geojson
        console.log('load from pag.')
        console.log(`TOTAL: ${total_pages}`)
        // console.log('getPage: ', getPage)
        let page = 1;
        while (page <= total_pages) {
            getPage(page++).then(geojson => this.addGeojson(geojson))
        }
    }
    
    /**
     * Removes all the data from the provided map object
     */
    async remove_all_data_from_map() {

        // Creates the Object containing an featureless geojson template of geographical FeatureCollections.
        var javascript_geojson  = {"type": "FeatureCollection", "features": [] };
        var javascript_survey_geojson = {"type": "FeatureCollection", "features": [] };

        //Sets the new;y created featureless geojson object to be the map data.
        this.map.getSource('DataPoints').setData(javascript_geojson);
        this.map.getSource('LineString').setData(javascript_survey_geojson);

    }

    /**
     * Adjusts the map bounds to just the rendered points.
     */
    async zoom_to_bounds() {

        // TODO: The `bounds` object below could be built directly, and we could use
        // some more complex math to optimise building it i.e. parse min/max lat/long
        // from each set as they are the only significant values.

        // Load the data to bound the map to
        var current_point_data = this.map.getSource('DataPoints')._data
        var current_survey_data = this.map.getSource('LineString')._data

        // Build a collection of all points to bound to
        let zoom_all_coordinates = {"type": "FeatureCollection", "features": [] };

        // Add all coordinate data
        if (current_point_data) {
            current_point_data.features.forEach(function(feature) {
                if (feature.geometry.type === 'Point'){
                    zoom_all_coordinates.features.push(feature.geometry.coordinates);
                } else {
                    throw new Error(`Unexpected geometry type: ${feature.geometry.type}`)
                }
            });
        }

        // Add all survey data. Must be converted to coordinates
        if (current_survey_data) {
            current_survey_data.features.forEach(function(feature) {
                if (feature.geometry.type === 'LineString'){
                    zoom_all_coordinates.features.push(...feature.geometry.coordinates)
                }
                if (feature.geometry.type === 'MultiLineString'){
                    feature.geometry.coordinates.forEach((path) => {
                        zoom_all_coordinates.features.push(...path)
                    });
                }
            });
        }

        if (zoom_all_coordinates.features[0]) {
            // Create a 'LngLatBounds' with both corners at the first coordinate.
            const bounds = new mapboxgl.LngLatBounds(
            [zoom_all_coordinates.features[0][0], zoom_all_coordinates.features[0][1]], // southwestern corner of the bounds
            [zoom_all_coordinates.features[0][0], zoom_all_coordinates.features[0][1]], // northeastern corner of the bounds
            );

            // Extend the 'LngLatBounds' to include every coordinate in the bounds result.
            for (let feature of zoom_all_coordinates.features) {
                bounds.extend(feature);
            }

            this.map.fitBounds(bounds, {
                padding: 60
            });
        }
    }

}

/**
 * Automatic Functions
 * These functions don't need to be called manually, they are called by the functions above when they need to be
 */

/**
 * Sets up how to draw points and lines on the map, empty geojson templates are provided to quickly draw the map on map setup
 * @param {mapboxgl.Map} map Map to set drawing paramters on.
 * @param {Object} javascript_geojson Object containing featureless geojson template of geographical FeatureCollections.
 * @param {Object} javascript_survey_geojson Object containing featureless geojson template of geographical FeatureCollections.
 * @returns {mapboxgl.Map} Mapbox Map object instance tied to `mapId` element.
 */
function draw_map(map, javascript_geojson, javascript_survey_geojson) {

    map.on('style.load', () => {

        map.addSource('LineString', {
            'type': 'geojson',
            'data': javascript_survey_geojson
        });
        map.addLayer({
            'id': 'LineStringLayer',
            'type': 'line',
            'source': 'LineString',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round',
            },
            'paint': {
                'line-width': 5,
                'line-color': ['get', 'line_colour']
            }
        });

        map.addSource('DataPoints', {
            type: 'geojson',
            // Point to GeoJSON data.
            data: javascript_geojson,
            cluster: true,
            clusterMaxZoom: 16, // Max zoom to cluster points on
            clusterRadius: 10 // Radius of each cluster when clustering points (defaults to 50)
        });

        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'DataPoints',
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#a4cf60',
                    100,
                    '#228848',
                    750,
                    '#1b2e5c'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                ]
            }
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'DataPoints',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        map.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'DataPoints',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#81c44c',
                    'circle-radius': 5,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#3d3935'
                }
            });

        async function make_popup(data) {
            const rawjsonstring = [data][0].features[0].properties.data;
            let record_data = JSON.parse(rawjsonstring);

            let popup_element;

            // Use specific template generators for defined record types.
            // Note specific templates require the respective methods to be available in the global scope.
            try {
                switch (record_data._recordtype) {
                    case 'trap':
                        popup_element = await showTrapPopup(record_data)
                        break
                    case 'field':
                        popup_element = await showFieldPopup(record_data)
                        break
                    case 'survey':
                        popup_element = await showSurveyPopup(record_data)
                        break
                    default:
                        // Fallback to basic key/value display
                        let container = document.createElement('div')
                        let popup_html = ''
                        for (var [key, value] of Object.entries(record_data)){
                            if (key == 'geojson') {
                                continue;  // We don't want to include the GeoJSON on the popup. Skip it
                            }

                            // Format the label for this datum.
                            let words_in_key = [];
                            key.split('_').forEach((word) => {
                                // Capitalise the first letter of each word.
                                words_in_key.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
                            });

                            // Start creating the resulting HTML for this datum.
                            let datum_html = "<b>" + words_in_key.join(" ") + "</b>: ";

                            // Check if the value should be hyperlinked (and link it).
                            let link = false;

                            datum_html += (link
                                ? "<a href=" + link + ">" + value + "</a>"  // If a valid link was found
                                : value  // Otherwise (if link == false)
                            )
                            datum_html += "<br>"
                            popup_html += datum_html;
                        }
                        container.innerHTML = popup_html
                        popup_element = container
                        break
                }
            } catch (error) {
                popup_element = document.createElement('div')
                popup_element.innerHTML = "Error fetching content"
                popup_element.classList.add('text-danger')
                console.error(error)
            }

            const popup = new mapboxgl.Popup()
                .setLngLat([data][0].lngLat)
                .setDOMContent(
                    popup_element
                );

            const targetElement = document.getElementById('map-popup');
            targetElement.innerHTML = "";
            targetElement.appendChild(popup._content);

            var displayPopup = document.getElementById('map-display');
            displayPopup.classList.add('popup-displayed');

            var closeButton = document.querySelector('.mapboxgl-popup-close-button');
            closeButton.addEventListener("click", function() {
                displayPopup.classList.remove('popup-displayed');
            });
        }

        map.on('click', 'unclustered-point', (pointdata) => {
            make_popup(pointdata);
        });

        map.on('click', 'LineStringLayer', (linedata) => {
            make_popup(linedata);
        });

        map.on('click', 'clusters', (clusterdata) => {

            var zoom = map.getZoom() + 1.7;

                const lnglat_list = [
                    clusterdata.lngLat.lng,
                    clusterdata.lngLat.lat
                ];

                map.flyTo({
                    zoom: zoom,
                    speed: 0.65,
                    center: lnglat_list
                });

        });

        map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseenter', 'unclustered-point', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseenter', 'LineStringLayer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'LineStringLayer', () => {
            map.getCanvas().style.cursor = '';
        });

    });

}



