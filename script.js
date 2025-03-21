/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlbmEtYW5pc2hjaCIsImEiOiJjbTVvN2podncwanJ5Mm1wbnNuczl6c214In0.2ltrEF0cJrURbPWpaKr9bg'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/standard',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 10 // starting zoom level
});

/*--------------------------------------------------------------------
MAP CONTROLS
--------------------------------------------------------------------*/
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());



const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: "ca" // Restricting search to Canada
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));



/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

//PREPARE DATA: STORE GEOJSON FROM URL AS VARIABLE
/*-------------------------------------------------------------------- */
let pedcyc;



fetch('https://raw.githubusercontent.com/Elena-Anishch/ggr472-wk10-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        pedcyc = response; // Store geojson as variable using URL from fetch response


        map.on('load', () => {

            //Add datasource using GeoJSON variable
            map.addSource('pedcyc', {
                type: 'geojson',
                data: pedcyc
            });

            map.addLayer({
                'id': 'pedcyc',
                'type': 'circle',
                'source': 'pedcyc',
                'paint': {
                    'circle-radius': 2,
                    'circle-color': 'blue'
                },
                'layout': {
                    'visibility': 'none' // Initially, hide the layer
                }
            });

            /*--------------------------------------------------------------------
                Step 3: CREATE BOUNDING BOX AND HEXGRID
            --------------------------------------------------------------------*/
            //HINT: All code to create and view the hexgrid will go inside a map load event handler
            //      First create a bounding box around the collision point data
            //      Access and store the bounding box coordinates as an array variable
            //      Use bounding box coordinates as argument in the turf hexgrid function
            //      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
            //                Consider return types from different turf functions and required argument types carefully here



            /*--------------------------------------------------------------------
                        Step 3: CREATE BOUNDING BOX AND HEXGRID
                        --------------------------------------------------------------------*/
            // Create a bounding box around the collision points
            let envresult = turf.envelope(pedcyc);
            console.log(envresult); // Inspect the bounding box result



            // Access the bounding box (bbox) property of the envelope result
            console.log(envresult.bbox);  // Logs the bbox array

            // Access specific values from the bbox array (minX, minY, maxX, maxY)
            console.log('minX:', envresult.bbox[0]);  // minX value (the minimum longitude)
            console.log('minY:', envresult.bbox[1]);  // minY value (the minimum latitude)
            console.log('maxX:', envresult.bbox[2]);  // maxX value (the maximum longitude)
            console.log('maxY:', envresult.bbox[3]);  // maxY value (the maximum latitude)

            let bboxgeojson = {
                "type": "Feature Collection",
                "features": [envresult]
            };
            console.log(bboxgeojson);

            //      console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);
            //     console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);
            //    console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);
            //      console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);



            let bboxscaled = turf.transformScale(envresult, 1.1);
            console.log(bboxscaled);

            let bbox = turf.bbox(bboxscaled);
            console.log(bbox);

            // Add the bounding box to the map as a layer
            map.addSource('bboxscaled', {
                type: 'geojson',
                data: bboxscaled
            });

            map.addLayer({
                'id': 'bboxscaled',
                'type': 'fill',
                'source': 'bboxscaled',
                'paint': {
                    'fill-color': 'rgb(219, 208, 208)',
                    "fill-opacity": 0.4,  // Semi-transparent red
                    'fill-outline-color': 'black',
                    'fill-outline-width': 20,  // Red outline
                },
                'layout': {
                    'visibility': 'none' // Initially, hide the layer
                }
            });


            let hexdata = turf.hexGrid(bbox, 0.5, { units: "kilometers" });
            console.log(hexdata);

            // Add the hex grid to the map
            //        map.addSource('hexdata', {
            //           type: 'geojson',
            //           data: hexdata
            //      });

            // Add layer to display the hex grid
            //       map.addLayer({
            //          'id': 'hexgrid-layer',
            //          'type': 'fill', // Using 'fill' for polygons (hexagons)
            //          'source': 'hexdata',
            //         'paint': {
            //            'fill-color': 'rgba(43, 255, 0, 0.5)', // Red fill with transparency
            //           'fill-outline-color': 'red' // Red outline
            //      }




            //});

            // Aggregate the unique IDs from the 'pedcyc' points within each hexagon
            let collishex = turf.collect(hexdata, pedcyc, "_id", "values");

            console.log(collishex); // Log the result to check the output

            let maxcollis = 0; // Initialize the variable to track the maximum number of collisions

            // Iterate through each feature (hexagon) in the 'Collishex' FeatureCollection
            collishex.features.forEach((feature) => {

                // Add a new property 'COUNT' to each hexagon feature
                // This property will store the number of collisions inside the current hexagon
                feature.properties.COUNT = feature.properties.values.length;

                // Check if the current 'COUNT' is greater than the previously stored 'maxcollis'
                if (feature.properties.COUNT > maxcollis) {

                    // If the current hexagon has more collisions, update the 'maxcollis' variable
                    maxcollis = feature.properties.COUNT;

                    // Optionally, you can log the feature to inspect it if needed
                    console.log("New Max Collision Hexagon:", feature);
                }
            });

            // After iterating through all the hexagons, log the maximum number of collisions found
            console.log("Maximum number of collisions in a hexagon:", maxcollis);


            // add the hexgrid source to the map 
            map.addSource("collishexgrid", {
                type: "geojson",
                data: collishex, // Ensure collishex is defined correctly
            });

            map.addLayer({
                id: "collishexfill",
                type: "fill",
                source: "collishexgrid",
                paint: {
                    "fill-color": [
                        "step",
                        ["get", "COUNT"],
                        "rgba(211, 211, 211, 0.5)", // Base color
                        1, "#feedde",  // Color for range 1 to 5
                        10, "#fdbe85",  // Color for range 5 to 10
                        20, "#e6550d",  // Color for range 10 to 15
                        30, "#a63603",  // Color for range above 15
                        40, "#7f2a00",  // Color for range above 15,
                     //   30, "#3e1410",


                        maxcollis, "#000000"
                    ],
                    "fill-opacity": 0.8,
                    "fill-outline-color": "red" // Add the red outline color here
                },
                'layout': {
                    'visibility': 'none' // Initially, hide the layer
                },
                filter: ["!=", ["get", "COUNT"], 0], // Only show hexagons where COUNT != 0


            });
            map.addLayer({
                id: "collishexfillmax",
                type: "fill",
                source: "collishexgrid",
                paint: {
                    "fill-color": [
                        "step",
                        ["get", "COUNT"],
                        "rgba(211, 211, 211, 0.5)", // Base color
                        55, "#39FF14"  // Color for COUNT 55
                    ],
                    "fill-opacity": 1,
                    "fill-outline-color": "black" // Red outline color
                },
                layout: {
                    "visibility": "none" // Initially hide the layer
                },
                filter: ["==", ["get", "COUNT"], 55] // Only show polygons with COUNT = 55
            });


// Add the collishextextmax layer (text layer)
map.addLayer({
    id: "collishextextmax",
    type: "symbol",
    source: "collishexgrid",
    layout: {
        "text-field": "55", // The text to display
        "text-size": 16, // Text size
        "text-anchor": "center", // Center the text
        "text-allow-overlap": true, // Allow overlap for clarity
        "text-ignore-placement": true // Allow the text to appear even if it overlaps with other labels
    },
    paint: {
        "text-color": "#FF0", // Bright yellow text color (you can use other bright colors like #00FFFF for cyan)
        "text-halo-color": "#000000", // Black halo color for better contrast
        "text-halo-width": 2 // Increase halo width for better readability
    },
    filter: ["==", ["get", "COUNT"], 55], // Only show text inside hexagons with COUNT = 55
    layout: {
        "visibility": "none" // Initially hide the text layer
    }
});








            
            // You can leave your existing Turf.js code here for hexgrid and other processing

            /*--------------------------------------------------------------------
            Layer Visibility Toggle Functions
            --------------------------------------------------------------------*/
            // Function to toggle visibility of a layer
            function toggleLayer(layerId, visible) {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
                }
            }

            /*--------------------------------------------------------------------
            Step 5: Checkbox Event Listeners for Layer Toggling
            --------------------------------------------------------------------*/
            /// Add event listener for the pedcyc checkbox
document.getElementById('pedcyc').addEventListener('change', function () {
    toggleLayer('pedcyc', this.checked); // Show or hide the 'pedcyc' layer based on checkbox
});

// Add event listener for the bboxscaled checkbox
document.getElementById('bboxscaled').addEventListener('change', function () {
    toggleLayer('bboxscaled', this.checked); // Show or hide the 'bboxscaled' layer based on checkbox
});

// Add event listener for the collishexfill checkbox
document.getElementById('collishexfill').addEventListener('change', function () {
    toggleLayer('collishexfill', this.checked); // Show or hide the 'collishexfill' layer based on checkbox
});

// Add event listener for the collishexfillmax checkbox
document.getElementById('collishexfillmax').addEventListener('change', function () {
    const isChecked = this.checked;

    // Toggle both the polygon layer and the text layer based on checkbox state
    toggleLayer('collishexfillmax', isChecked);  // Toggle the polygon layer
    toggleLayer('collishextextmax', isChecked);  // Toggle the text layer
    
});

// Function to toggle layers visibility
function toggleLayer(layerId, isVisible) {
    map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
}


            /*--------------------------------------------------------------------
            CREATE LEGEND IN JAVASCRIPT
            --------------------------------------------------------------------*/
            //Declare array variables for labels and colours
            const legendlabels = [
                '1 +  ',
                '10 + ',
                '20 +',
                '30 +',
                '40 +',
                '55 ',
                'Danger Zone - Most Collisions',
            ];

            const legendcolours = [
                '#feedde',
                '#fdbe85',
                '#e6550d',
                '#a63603',
                '#7f2a00',
                '#000000', 
                '#39FF14'
            ];


            //Declare legend variable using legend div tag
            const legend = document.getElementById('legend');

            //For each layer create a block to put the colour and label in
            legendlabels.forEach((label, i) => {
                const colour = legendcolours[i];

                const item = document.createElement('div'); //each layer gets a 'row' - this isn't in the legend yet, we do this later
                const key = document.createElement('span'); //add a 'key' to the row. A key will be the colour circle

                key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
                key.style.backgroundColor = colour; // the background color is retreived from teh layers array

                const value = document.createElement('span'); //add a value variable to the 'row' in the legend
                value.innerHTML = `${label}`; //give the value variable text based on the label

                item.appendChild(key); //add the key (colour cirlce) to the legend row
                item.appendChild(value); //add the value to the legend row

                legend.appendChild(item); //add row to the legend
            });


            /*--------------------------------------------------------------------
            ADD INTERACTIVITY BASED ON HTML EVENT
            --------------------------------------------------------------------*/

            // 1) Add event listener which returns map view to full screen on button click using flyTo method
            document.getElementById('returnbutton').addEventListener('click', () => {
                map.flyTo({
                    center: [-79.42, 43.7], // Coordinates for Toronto
                    zoom: 10,               // Adjust the zoom level to focus on Toronto
                    essential: true          // Ensures the animation is smooth and critical
                });
            });

            
            // 1) Add event listener which returns map view to full screen on button click using flyTo method
            document.getElementById('returnbuttonmax').addEventListener('click', () => {
                map.flyTo({
                    center: [-79.378, 43.648], // Coordinates for Toronto
                    zoom: 15,               // Adjust the zoom level to focus on Toronto
                    essential: true          // Ensures the animation is smooth and critical
                });
            });


            // 2) Change display of legend based on check box
            let legendcheck = document.getElementById('legendcheck');

            legendcheck.addEventListener('click', () => {
                if (legendcheck.checked) {
                    legendcheck.checked = true;
                    legend.style.display = 'block';
                }
                else {
                    legend.style.display = "none";
                    legendcheck.checked = false;
                }
            });







            // Add event listener for any additional layers (if you add more layers in the future)

            console.log(map.getStyle().layers);  // This will show all layers on the map

            // Initialize an empty object to store the count of hexagons for each 'COUNT' value
            let countMap = {};

            // Iterate through each hexagon feature in 'collishex'
            collishex.features.forEach((feature) => {
                // Extract the 'COUNT' value for the current hexagon
                let count = feature.properties.COUNT;

                // Check if the 'COUNT' value is already in the map
                if (countMap[count]) {
                    // If it exists, increment the count
                    countMap[count]++;
                } else {
                    // If it doesn't exist, initialize the count at 1
                    countMap[count] = 1;
                }
            });



            // Get the button, popup, and close button elements
            const openPopupBtn = document.getElementById("openPopupBtn");
            const popup = document.getElementById("popup");
            const closePopupBtn = document.getElementById("closePopupBtn");

            // Open the popup when the "INSTRUCTIONS" button is clicked
            openPopupBtn.addEventListener("click", function () {
                popup.style.display = "flex"; // Show the popup
            });

            // Close the popup when the "×" close button is clicked
            closePopupBtn.addEventListener("click", function () {
                popup.style.display = "none"; // Hide the popup
            });

            // Log the result to see the counts for each 'COUNT' value
            console.log(countMap);



        });

// #1
        // Add click event listener to the hexgrid layer
        map.on('click', 'collishexfill', function (e) {
            // Get the features under the click event
            const features = map.queryRenderedFeatures(e.point, { layers: ['collishexfill'] });

            if (!features.length) return;  // Return if no feature is found

            const feature = features[0];  // The clicked hexagon feature
            const count = feature.properties.COUNT;  // Access the COUNT property

            // Create a popup with the count of collisions
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)  // Set the popup's position at the clicked point
                .setHTML(`<strong>Number of Collisions: </strong>${count}`)  // Add content to the popup
                .addTo(map);  // Add the popup to the map
        });

        // Change the cursor to a pointer when hovering over the hexagons
        map.on('mouseenter', 'collishexfill', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to default when leaving the hexagons
        map.on('mouseleave', 'collishexfill', function () {
            map.getCanvas().style.cursor = '';
        });

// #2
        // Add click event listener to the hexgrid layer
        map.on('click', 'collishexfillmax', function (e) {
            // Get the features under the click event
            const features = map.queryRenderedFeatures(e.point, { layers: ['collishexfillmax'] });

            if (!features.length) return;  // Return if no feature is found

            const feature = features[0];  // The clicked hexagon feature
            const count = feature.properties.COUNT;  // Access the COUNT property

            // Create a popup with the count of collisions
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)  // Set the popup's position at the clicked point
                .setHTML(`<strong>Max # of collisions: </strong>${count}`)  // Add content to the popup
                .addTo(map);  // Add the popup to the map
        });

        // Change the cursor to a pointer when hovering over the hexagons
        map.on('mouseenter', 'collishexfillmax', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to default when leaving the hexagons
        map.on('mouseleave', 'collishexfillmax', function () {
            map.getCanvas().style.cursor = '';
        });



        

        /*--------------------------------------------------------------------
        Step 4: AGGREGATE COLLISIONS BY HEXGRID
        --------------------------------------------------------------------*/
        //HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
        //      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



        // /*--------------------------------------------------------------------
        // Step 5: FINALIZE YOUR WEB MAP
        // --------------------------------------------------------------------*/
        //HINT: Think about the display of your data and usability of your web map.
        //      Update the addlayer paint properties for your hexgrid using:
        //        - an expression
        //        - The COUNT attribute
        //        - The maximum number of collisions found in a hexagon
        //      Add a legend and additional functionality including pop-up windows


    })