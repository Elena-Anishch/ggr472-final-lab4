/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/

// Define the Mapbox access token required to use the Mapbox API.
mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlbmEtYW5pc2hjaCIsImEiOiJjbTVvN2podncwanJ5Mm1wbnNuczl6c214In0.2ltrEF0cJrURbPWpaKr9bg'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize the map object with basic settings such as container, style, center coordinates, and zoom level.
const map = new mapboxgl.Map({
    container: 'map', // The ID of the HTML container where the map will be displayed.
    style: 'mapbox://styles/mapbox/standard',  // Map style (you can change this to another Mapbox style).
    center: [-79.39, 43.65],  // The initial center of the map (longitude, latitude) for Toronto.
    zoom: 10 // The initial zoom level of the map.
});

/*--------------------------------------------------------------------
MAP CONTROLS
--------------------------------------------------------------------*/

// Add navigation controls (zoom in/out and rotate) to the map.
map.addControl(new mapboxgl.NavigationControl());

// Add fullscreen control to the map.
map.addControl(new mapboxgl.FullscreenControl());

// Create a geocoder object (search box) to allow users to search places in Canada.
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,  // Use the Mapbox access token.
    mapboxgl: mapboxgl,  // Reference the Mapbox GL library.
    countries: "ca" // Restrict the search to Canada.
});

// Attach the geocoder control to an HTML element with the ID 'geocoder'.
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// Initialize a variable to store the collision data.
let pedcyc;

// Fetch the GeoJSON data for collisions from a URL.
fetch('https://raw.githubusercontent.com/Elena-Anishch/ggr472-wk10-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json()) // Parse the JSON response.
    .then(response => {
        console.log(response); // Log the response to the console for debugging.
        pedcyc = response; // Store the GeoJSON data into the 'pedcyc' variable.

        map.on('load', () => {  // Wait until the map is fully loaded.

            // Add the collision data (GeoJSON) as a source to the map.
            map.addSource('pedcyc', {
                type: 'geojson',
                data: pedcyc
            });

             // Add a layer to the map to display collision points as blue circles.
    map.addLayer({
        'id': 'pedcyc',  // Layer ID
        'type': 'circle',  // The layer type (circle for points)
        'source': 'pedcyc',  // Data source for this layer
        'paint': {
            // Use zoom as an expression to adjust circle size dynamically
            'circle-radius': [
                'interpolate', // This will interpolate the circle size
                ['linear'],    // Linear interpolation
                ['zoom'],      // Use the zoom level
                10, 2,         // At zoom level 10, the radius is 2
                12, 9       // At zoom level 13, the radius is 4
            ],
            'circle-color': 'blue'  // Color of the circle.
        },
        'layout': {
            // Layout settings (empty in this case)
        }
            });





            
           
            /*--------------------------------------------------------------------
                        Step 3: CREATE BOUNDING BOX AND HEXGRID
                        --------------------------------------------------------------------*/
            // Create a bounding box (envelope) around the collision points using Turf.js.
            let envresult = turf.envelope(pedcyc);
            console.log(envresult); // Log the bounding box result.

            // Access and log the bounding box (bbox) property from the envelope result.
            console.log(envresult.bbox);

            // Log specific values from the bbox array: minX, minY, maxX, maxY (bounding box coordinates).
            console.log('minX:', envresult.bbox[0]);
            console.log('minY:', envresult.bbox[1]);
            console.log('maxX:', envresult.bbox[2]);
            console.log('maxY:', envresult.bbox[3]);

            // Create a GeoJSON feature collection containing the bounding box.
            let bboxgeojson = {
                "type": "Feature Collection",
                "features": [envresult]
            };
            console.log(bboxgeojson);

            //      console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);
            //     console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);
            //    console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);
            //      console.log(bboxgeojson.features[0].geometry.coordiantes[0][0][1]);



            
            // Scale the bounding box by 10% using Turf.js.
            let bboxscaled = turf.transformScale(envresult, 1.1);
            console.log(bboxscaled); // Log the scaled bounding box.

            // Get the bounding box of the scaled envelope.
            let bbox = turf.bbox(bboxscaled);
            console.log(bbox);  // Log the bounding box of the scaled envelope.

            // Add the scaled bounding box as a new source to the map.
            map.addSource('bboxscaled', {
                type: 'geojson',
                data: bboxscaled
            });

            // Add a layer to display the scaled bounding box.
            map.addLayer({
                'id': 'bboxscaled',
                'type': 'fill',  // Use a fill type to display the bounding box.
                'source': 'bboxscaled',
                'paint': {
                    'fill-color': 'rgb(219, 208, 208)',  // Light gray fill color.
                    "fill-opacity": 0.4,  // Set transparency.
                    'fill-outline-color': 'black',  // Outline color of the bounding box.
                    'fill-outline-width': 20,  // Outline width.
                },
                'layout': {
                    'visibility': 'none' // Initially hide the bounding box layer.
                }
            });

            // Create a hexagonal grid using the bounding box as the extent.
            let hexdata = turf.hexGrid(bbox, 0.5, { units: "kilometers" });
            console.log(hexdata); // Log the generated hexagonal grid.

            // Aggregate collision points within each hexagon and store the results in 'collishex'.
            let collishex = turf.collect(hexdata, pedcyc, "_id", "values");
            console.log(collishex); // Log the hexagon features with aggregated data.

            let maxcollis = 0;  // Initialize a variable to track the maximum collision count.

            // Loop through each hexagon and count the number of collisions in each.
            collishex.features.forEach((feature) => {
                feature.properties.COUNT = feature.properties.values.length;  // Store the count of collisions in 'COUNT'.

                // Update the maximum collision count if the current hexagon has more collisions.
                if (feature.properties.COUNT > maxcollis) {
                    maxcollis = feature.properties.COUNT;
                    console.log("New Max Collision Hexagon:", feature);  // Log the hexagon with the new max count.
                }
            });

            // Log the maximum number of collisions found in any hexagon.
            console.log("Maximum number of collisions in a hexagon:", maxcollis);


            // Add the hexagonal grid data as a source to the map.
            map.addSource("collishexgrid", {
                type: "geojson",
                data: collishex,  // Use the 'collishex' GeoJSON data.
            });

             // Add a layer to display the hexagonal grid with different colors based on collision counts.
            map.addLayer({
                id: "collishexfill",
                type: "fill",
                source: "collishexgrid",
                paint: {
                    "fill-color": [
                        "step",
                        ["get", "COUNT"],
                        "rgba(211, 211, 211, 0.5)", // Base color for 0 collisions
                        1, "#feedde",  // Color for hexagons with 1-5 collisions
                        10, "#fdbe85",  // Color for hexagons with 5-10 collisions
                        20, "#e6550d",  // Color for hexagons with 10-15 collisions
                        30, "#a63603",  // Color for hexagons with 15-20 collisions
                        40, "#7f2a00",  // Color for hexagons with 20-40 collisions
                        maxcollis, "#000000" // Color for hexagons with max collisions.
                    ],
                    "fill-opacity": 0.8,  // Set opacity for fill color.
                    "fill-outline-color": "red"  // Add red outline for the hexagons.
                },
                'layout': {
                    'visibility': 'none' // Initially hide the hexagonal grid layer.
                },
                filter: ["!=", ["get", "COUNT"], 0],  // Only show hexagons where the collision count is non-zero.
            });

// Add another layer to highlight hexagon with the maximum collision count.
            map.addLayer({
                id: "collishexfillmax",  // Set the layer ID as "collishexfillmax" for identifying the layer
                type: "fill",  // Specify that this layer will be a fill type (polygon shapes)
                source: "collishexgrid",  // Define the data source for the layer as "collishexgrid" (the hexagonal collision data)
                paint: {  // Paint properties control how the layer is rendered
                    "fill-color": [
                        "step",  // Use a "step" function to create a color range based on the "COUNT" property
                        ["get", "COUNT"],  // Access the "COUNT" property to determine the color based on collision counts
                        "rgba(211, 211, 211, 0.5)", // Base color for areas with low or no collisions (light gray with transparency)
                        55, "#FF0000"  // For areas with COUNT equal to 55, use bright red (#FF0000)
                    ],
                    "fill-opacity": 1,  // Set the opacity of the fill to 100% (solid fill)
                    "fill-outline-color": "black" // Outline color for the polygons is set to black
                },
                layout: {
                    "visibility": "none"  // Initially set the layer to be hidden from the map
                },
                filter: ["==", ["get", "COUNT"], 55]  // Only show polygons where the "COUNT" property is exactly 55
            });


            // Add another layer for the safe zones
            map.addLayer({
                id: "collishexfillzero",  // Set the layer ID as "collishexfillzero" for identifying the layer
                type: "fill",  // Specify that this layer will be a fill type (polygon shapes)
                source: "collishexgrid",  // Define the data source for the layer as "collishexgrid" (the hexagonal collision data)
                paint: {  // Paint properties control how the layer is rendered
                    "fill-color": [
                        "step",  // Use a "step" function to create a color range based on the "COUNT" property
                        ["get", "COUNT"],  // Access the "COUNT" property to determine the color based on collision counts
                        "hsla(91, 49.60%, 75.10%, 0.50)", // Base color for areas with low or no collisions (light gray with transparency)
                        0, "rgba(144, 238, 144, 0.5)"  // For areas with COUNT equal to 0, use a red color (#FF0000)
                    ],
                    "fill-opacity": 1,  // Set the opacity of the fill to 100% (solid fill)
                    "fill-outline-color": "black" // Outline color for the polygons is set to black
                },
                layout: {
                    "visibility": "none"  // Initially set the layer to be hidden from the map
                },
                filter: ["==", ["get", "COUNT"], 0]  // Only show polygons where the "COUNT" property is exactly 0
            });


/// Add the collishextextmax layer (text layer)- STEP TO DO IN FUTURE:
//map.addLayer({
//    id: "collishextextmax",  // Set the layer ID as "collishextextmax" for easy reference
//    type: "symbol",  // Define the layer type as a symbol layer (used for rendering text or icons)
 //   source: "collishexgrid",  // Set the data source for this layer to be "collishexgrid" (hexagonal grid with collision data)
//    layout: {
 //       "text-field": "55",  // Define the text to display inside each hexagon. In this case, the number "55" is hardcoded to show in the hexagons
 //       "text-size": 16,  // Set the size of the text to 16 pixels
 //       "text-anchor": "center",  // Center the text inside the hexagon (both horizontally and vertically)
 //       "text-allow-overlap": true,  // Allow the text to overlap other map elements (useful for densely packed labels)
//        "text-ignore-placement": true  // Allow the text to be displayed even if it overlaps with other map features or labels
//    },
 //   paint: {
 //       "text-color": "#FF0",  // Set the text color to bright yellow (hex: #FF0)
 //       "text-halo-color": "#000000",  // Set the color of the halo (outline) around the text to black for better contrast
 //       "text-halo-width": 2  // Set the width of the text's halo (outline) to 2 pixels to improve readability
 //   },
 //   filter: ["==", ["get", "COUNT"], 55],  // Only display the text in hexagons where the "COUNT" property is exactly 55
 //   layout: {
 //       "visibility": "none"  // Initially hide the text layer (it will only be visible when triggered by interaction or another function)
 //   }
//});


/*--------------------------------------------------------------------
    Layer Visibility Toggle Functions
--------------------------------------------------------------------*/

// Function to toggle visibility of a map layer
function toggleLayer(layerId, visible) {
    // Check if the layer exists before attempting to change visibility
    if (map.getLayer(layerId)) {
        // Set the visibility property of the specified layer
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
}

/*--------------------------------------------------------------------
    Step 5: Checkbox Event Listeners for Layer Toggling
--------------------------------------------------------------------*/

// Add event listener for the 'pedcyc' checkbox
document.getElementById('pedcyc').addEventListener('change', function () {
    // Toggle visibility of the 'pedcyc' layer based on whether the checkbox is checked or not
    toggleLayer('pedcyc', this.checked); // If checked, show the layer; if unchecked, hide the layer
});

// Add event listener for the 'bboxscaled' checkbox
document.getElementById('bboxscaled').addEventListener('change', function () {
    // Toggle visibility of the 'bboxscaled' layer based on whether the checkbox is checked or not
    toggleLayer('bboxscaled', this.checked); // If checked, show the layer; if unchecked, hide the layer
});

// Add event listener for the 'collishexfill' checkbox
document.getElementById('collishexfill').addEventListener('change', function () {
    // Toggle visibility of the 'collishexfill' layer based on checkbox state
    toggleLayer('collishexfill', this.checked); // If checked, show the layer; if unchecked, hide the layer
});
//Add event listener for the " SAFE ZONE"
document.getElementById('collishexfillzero').addEventListener('change', function () {
    toggleLayer('collishexfillzero', this.checked); // Show or hide the 'collishexfillzero' layer based on checkbox
});
// Add event listener for the 'collishexfillmax' checkbox
document.getElementById('collishexfillmax').addEventListener('change', function () {
    const isChecked = this.checked;  // Store the state of the checkbox (checked or unchecked)

    // Toggle both the polygon layer ('collishexfillmax') and the text layer ('collishextextmax') based on checkbox state
    toggleLayer('collishexfillmax', isChecked);  // Toggle the polygon layer visibility
    toggleLayer('collishextextmax', isChecked);  // Toggle the text layer visibility
});

// Function to toggle layers visibility (this function is defined earlier but reiterated here for clarity)
function toggleLayer(layerId, isVisible) {
    // Set the visibility of the specified layer based on whether it's marked as 'visible' or 'none'
    map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
}


           /*--------------------------------------------------------------------
    CREATE LEGEND IN JAVASCRIPT
--------------------------------------------------------------------*/

// Declare an array of labels that will represent the categories in the legend
const legendlabels = [
    '1 +  ',  // Label for 1 or more collisions
    '10 + ',  // Label for 10 or more collisions
    '20 +',   // Label for 20 or more collisions
    '30 +',   // Label for 30 or more collisions
    '40 +',   // Label for 40 or more collisions
    '55 ',    // Label for exactly 55 collisions
    'Danger Zone - Most Collisions', // Label indicating a danger zone with the most collisions
];

// Declare an array of corresponding colors for each label in the legend
const legendcolours = [
    '#feedde',  // Light color for the first category (1+)
    '#fdbe85',  // Orange color for the next category (10+)
    '#e6550d',  // Darker orange for the next category (20+)
    '#a63603',  // Redder shade for 30+
    '#7f2a00',  // Dark red for 40+
    '#000000',  // Black color for exactly 55 collisions
    '#FF0000'   // Bright red for the danger zone (highest collision zone)
];

// Declare a variable to reference the div element that will hold the legend
const legend = document.getElementById('legend');

// Loop through the labels array to create each legend item dynamically
legendlabels.forEach((label, i) => {
    const colour = legendcolours[i];  // Retrieve the color corresponding to the current label

    // Create a new div element to represent each legend row (each block for a label-color pair)
    const item = document.createElement('div'); 

    // Create a span element for the color circle (key) of the legend item
    const key = document.createElement('span'); 

    key.className = 'legend-key';  // Add a class for styling the key (color circle) via CSS
    key.style.backgroundColor = colour;  // Set the background color of the key from the colors array

    // Create a span element for the text value (label) that describes the category
    const value = document.createElement('span'); 

    value.innerHTML = `${label}`;  // Set the text inside the span element to the current label

    // Append the key (color circle) and value (text label) to the item div (legend row)
    item.appendChild(key); 
    item.appendChild(value); 

    // Finally, append the constructed item (legend row) to the legend div
    legend.appendChild(item); 
});

/*--------------------------------------------------------------------
    ADD INTERACTIVITY BASED ON HTML EVENT
--------------------------------------------------------------------*/

// 1) Add event listener which returns the map view to full screen on button click using flyTo method
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.42, 43.7],  // Coordinates for Toronto (center of the map)
        zoom: 10,                // Set zoom level to 10 (wide zoom for city-level view)
        essential: true          // Ensures the animation is smooth and treated as critical
    });
});

// 2) Another event listener to return to a more zoomed-in view of Toronto
document.getElementById('returnbuttonmax').addEventListener('click', () => {
    map.flyTo({
        center: [-79.378, 43.648], // More specific coordinates within Toronto
        zoom: 15,                  // Zoom in more closely on Toronto (closer street-level view)
        essential: true            // Smooth animation transition
    });
});

// 3) Change display of the legend based on the checkbox state
let legendcheck = document.getElementById('legendcheck');

// Event listener to toggle the visibility of the legend when the checkbox is clicked
legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;          // Mark the checkbox as checked
        legend.style.display = 'block';     // Show the legend
    } else {
        legend.style.display = 'none';      // Hide the legend if unchecked
        legendcheck.checked = false;        // Mark the checkbox as unchecked
    }
});

// 4) Log the map layers to the console for debugging or exploring available layers
console.log(map.getStyle().layers);

// 5) Initialize an empty object to store the count of hexagons for each 'COUNT' value
let countMap = {};

// 6) Iterate through each hexagon feature in 'collishex' and populate the countMap
collishex.features.forEach((feature) => {
    let count = feature.properties.COUNT;  // Extract the 'COUNT' value for each feature

    // Increment the count for the corresponding 'COUNT' value
    if (countMap[count]) {
        countMap[count]++;
    } else {
        countMap[count] = 1;  // Initialize count at 1 if it doesn't exist
    }
});

// 7) Get the elements for the popup, open button, and close button
const openPopupBtn = document.getElementById("openPopupBtn");
const popup = document.getElementById("popup");
const closePopupBtn = document.getElementById("closePopupBtn");

// 8) Open the popup when the "INSTRUCTIONS" button is clicked
openPopupBtn.addEventListener("click", function () {
    popup.style.display = "flex"; // Show the popup
});

// 9) Close the popup when the "×" close button is clicked
closePopupBtn.addEventListener("click", function () {
    popup.style.display = "none"; // Hide the popup
});

// 10) Log the count map to check how many hexagons exist for each 'COUNT' value
console.log(countMap);


/*--------------------------------------------------------------------
    INTERACTIVITY WITH HEXAGON LAYER
--------------------------------------------------------------------*/

// #1: Add a click event listener for the 'collishexfill' layer (standard hexagons layer)
map.on('click', 'collishexfill', function (e) {
    const features = map.queryRenderedFeatures(e.point, { layers: ['collishexfill'] });

    if (!features.length) return;  // Exit if no feature is found under the clicked point

    const feature = features[0];  // Access the first (and only) clicked hexagon feature
    const count = feature.properties.COUNT;  // Extract the 'COUNT' property of the hexagon

    // Create a popup to display the number of collisions for the clicked hexagon
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)  // Set the popup's position at the clicked location
        .setHTML(`<strong>Number of Collisions: </strong>${count}`)  // Show the count in the popup
        .addTo(map);  // Add the popup to the map
});

// Change the cursor to a pointer when hovering over hexagons
map.on('mouseenter', 'collishexfill', function () {
    map.getCanvas().style.cursor = 'pointer';  // Cursor becomes a pointer to indicate interactivity
});

// Change the cursor back to default when leaving the hexagon area
map.on('mouseleave', 'collishexfill', function () {
    map.getCanvas().style.cursor = '';  // Reset cursor to default
});


// #2: Add a click event listener for the 'collishexfillmax' layer (max collision hexagons layer)
map.on('click', 'collishexfillmax', function (e) {
    const features = map.queryRenderedFeatures(e.point, { layers: ['collishexfillmax'] });

    if (!features.length) return;  // Exit if no feature is found under the clicked point

    const feature = features[0];  // Access the clicked hexagon feature
    const count = feature.properties.COUNT;  // Extract the 'COUNT' property

    // Create a popup to display the max number of collisions for the clicked hexagon
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)  // Set the popup's position at the clicked location
        .setHTML(`<strong>Max # of collisions: </strong>${count}`)  // Show the count in the popup
        .addTo(map);  // Add the popup to the map
});

// Change the cursor to a pointer when hovering over hexagons (max collision layer)
map.on('mouseenter', 'collishexfillmax', function () {
    map.getCanvas().style.cursor = 'pointer';  // Show pointer cursor for interactivity
});

// Change the cursor back to default when leaving the hexagons (max collision layer)
map.on('mouseleave', 'collishexfillmax', function () {
    map.getCanvas().style.cursor = '';  // Reset cursor to default when not hovering
});

        })})

        