# Scalable reassignment of points on a map

This package contains a standalone HTML page that enables editing a file to assign elements from a map to facilities by groups, using some shapes drawing.

This small example uses the Leaflet.js library to handle the map and shapes drawing, and Turf.js to decide whether or not the point's latitudes/longitudes belong in the shapes.

I included a save/load function that enables stopping at some point and restarting from there.

This example scales to up to 100,000 points at the same time.

Colors can be edited from the `data/colors.js` file.
