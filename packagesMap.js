// package data is loaded in the dictionnary "data"

var map = new L.Map('leaflet', {
    'center': [data.packages[0][0].latitude, data.packages[0][0].longitude],
    'zoom': 13
});

var BuildingIcon = L.icon({
    iconUrl: "https://img.icons8.com/ios/50/000000/home--v1.png",
    iconSize: [48, 48],
    // iconAnchor: [22, 94],
    // popupAnchor: [-3, -76],
    shadowSize: [68, 95],
    shadowAnchor: [22, 94]
});

var legend = L.control({position: 'topright'});

L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

var nTotalbuildings = 0;
for (var k in data.buildings) {
    if (data.buildings.hasOwnProperty(k)) {
       ++nTotalbuildings;
    }
}
var currentBuilding = "0";
var currentFinishedbuildings = 0;
var informativeMarkers = new L.LayerGroup().addTo(map);
var packagesMarkers = new L.LayerGroup().addTo(map);
var BuildingType = data.buildings[currentBuilding].type;
var labelsLegend = [];
var divLegend = L.DomUtil.create('div', 'info legend');

var buttonValidateBuilding = document.createElement("button");
buttonValidateBuilding.innerHTML="Validate";

var buttonNextBuilding = document.createElement("button");
buttonNextBuilding.innerHTML="Next Building";

var buttonSaveOutput = document.createElement("button");
buttonSaveOutput.innerHTML="Download Output";

var divLegendText = document.createElement("div");
var divLegendStats = document.createElement("div");
var progressBar = document.createElement("progress");
progressBar.setAttribute("value",0);
progressBar.setAttribute("max",nTotalbuildings);

var inputJson = document.createElement("input");
inputJson.setAttribute("type","file");
inputJson.setAttribute("id","file");

var changeBuildingBox = document.createElement("input");
changeBuildingBox.setAttribute("type", "text");
changeBuildingBox.setAttribute("placeholder", "Building Id...");

var submitbuildingsearch = document.createElement("button");
submitbuildingsearch.innerHTML="Go to Building";

divLegend.appendChild(changeBuildingBox);
divLegend.appendChild(submitbuildingsearch);
linebreak = document.createElement("br");
divLegend.appendChild(linebreak);

divLegend.appendChild(buttonValidateBuilding);
divLegend.appendChild(buttonNextBuilding);
divLegend.appendChild(progressBar)
divLegend.appendChild(divLegendText);
divLegend.appendChild(divLegendStats);
divLegend.appendChild(buttonSaveOutput);
divLegend.appendChild(inputJson);

function displayBuilding(){
    var BuildingMarker = new L.Marker([
        data.buildings[currentBuilding].latitude,
        data.buildings[currentBuilding].longitude
    ], {icon:BuildingIcon}).addTo(informativeMarkers);
    BuildingMarker.bindTooltip("Building "+currentBuilding);
    labelsLegend.push("D0");
}

function updateStats(){
    divLegendStats.innerHTML = "<h4>Current Assignment for Building " + currentBuilding + ":</h3>"
    packagesPerDepot = {}
    data.packages[currentBuilding].forEach(x=>{
        if (!(x.depot in packagesPerDepot)){
            packagesPerDepot[x.depot] = 1
        }
        else{
            packagesPerDepot[x.depot] += 1
        }
    })
    if ("D0" in packagesPerDepot){
        divLegendStats.innerHTML +=
            "Direct to Building: "+packagesPerDepot.D0 +' packages<br>';
    }
    if ("R1" in packagesPerDepot){
        divLegendStats.innerHTML +=
            "First run: "+packagesPerDepot.R1 +' packages<br>';
    }
    if ("R2" in packagesPerDepot){
        divLegendStats.innerHTML +=
            "Second run: "+packagesPerDepot.R2 +' packages<br>';
    }
    for (const [id, nStuds] of Object.entries(packagesPerDepot)){
        if (id != "R1" & id != "R2" & id != "D0"){
            divLegendStats.innerHTML +=
            "Depot "+id + ": "+nStuds +' packages<br>';
        }
    }
    progressBar.setAttribute("value",currentFinishedbuildings);
}

// Add all depots valid for the Building
function displayDepots(){
    BuildingType = data.buildings[currentBuilding].type;
    if (BuildingType==1){
        for (const [id, info] of Object.entries(data.depots1)) {
            var marker = new L.circleMarker([
                info.latitude,
                info.longitude
            ], style={
                radius:10,
                fillColor:depotColors[id],
                color:depotColors[id]
            }).addTo(informativeMarkers);
            marker.bindTooltip(id);
            labelsLegend.push(id);
        }
    }
    else{
        for (const [id, info] of Object.entries(data.depots2)) {
            var marker = new L.circleMarker([
                info.latitude,
                info.longitude
            ], style={
                radius:10,
                fillColor:depotColors[id],
                color:depotColors[id]
            }).addTo(informativeMarkers);
            marker.bindTooltip(id);
            labelsLegend.push(id);
        }
    }
}

function updateLegend(){
    // loop through our density intervals and generate a label with a colored square for each interval
    divLegendText.innerHTML = ""
    for (var i = 0; i < labelsLegend.length; i++) {
        divLegendText.innerHTML +=
            (" <div class='color-box' style='background-color:"+depotColors[labelsLegend[i]]+"'></div>    ") + labelsLegend[i] +'<br>';
    }
}
legend.onAdd = function (map) {
    return divLegend;
};

legend.addTo(map);

function displaypackages(){
    data.packages[currentBuilding].forEach(x=>{
        var marker = new L.circleMarker([
            x.latitude,
            x.longitude
        ], style={
            radius:2,
            fillColor:depotColors[x.depot],
            color:depotColors[x.depot]
        }).addTo(packagesMarkers);
    })
}

// 
new L.Control.Draw({
    draw: {
        marker   : false,
        polygon  : true,
        polyline : false,
        rectangle: true,
        circle   : {
            metric: 'metric'
        }
    },
    edit: false
}).addTo(map);

L.Polygon.include({
    contains: function (latLng) {
        return turf.inside(new L.Marker(latLng).toGeoJSON(), this.toGeoJSON());
    } 
});

L.Rectangle.include({
    contains: function (latLng) {
        return this.getBounds().contains(latLng);
    }
});

L.Circle.include({
    contains: function (latLng) {
        return this.getLatLng().distanceTo(latLng) < this.getRadius();
    }
});

map.on(L.Draw.Event.CREATED, function (e) {
    correctChoice = false;
    var message ="Please enter a routing choice"
    var newDepot = "D0";
    while(correctChoice==false){
        newDepot = prompt(message, "");
        // Check if depot chosen is correct
        if (newDepot == "D0"){
            correctChoice=true
        }
        else {
            var type = data.buildings[currentBuilding].type;
            
            if (type == 1){
                if (newDepot in data.depots1){
                    correctChoice = true
                }
            }
            else if (type == 2){
                if (newDepot in data.depots2){
                    correctChoice = true
                }
            }
        }
        if (!correctChoice){
            message = "please choose another routing choice"
        }
    }
    var locationsToUpdate = new Set()
    packagesMarkers.eachLayer(function (marker) {
        if (e.layer.contains(marker.getLatLng())) {
            locationsToUpdate.add(JSON.stringify(marker.getLatLng()));
            marker.setStyle({fillColor:depotColors[newDepot], color:depotColors[newDepot]});
        }
    });
    // Update the depot for packages in this location
    data.packages[currentBuilding].forEach(x=>{
        if (locationsToUpdate.has(JSON.stringify({lat:x.latitude, lng:x.longitude}))){
            x.depot=newDepot;
            console.log("Depot changed for package "+ x.originalId+" to "+newDepot)
        }
    })
    updateStats();
});


// Change Building and validate

function onValidateBuilding(e){
    data.buildings[currentBuilding].valid=true;
    currentFinishedbuildings += 1;
    alert("Building "+currentBuilding+" has been successfully validated!")
    updateStats()
}

function switchToNextBuilding(e){
    var foundNewBuilding = false
    for (const [id, info] of Object.entries(data.buildings)) {
        if (!("valid" in info)|!(info.valid)){
            currentBuilding = id
            foundNewBuilding = true
            break
        }
    }
    if (!foundNewBuilding){
        alert("No New Building Available");
    }
    else{
        informativeMarkers.clearLayers()
        packagesMarkers.clearLayers()
        labelsLegend = []
        displayBuilding()
        displayDepots()
        displaypackages()
        updateLegend()
        updateStats()
    }
}

function goToBuilding(event){
    var foundNewBuilding = false;
    var newBuilding = changeBuildingBox.value;
    for (const [id, info] of Object.entries(data.buildings)) {
        if (String(id) == String(newBuilding)){
            currentBuilding = id
            foundNewBuilding = true
            break
        }
    }
    if (!foundNewBuilding){
        alert("Building Not Found");
    }
    else{
        informativeMarkers.clearLayers()
        packagesMarkers.clearLayers()
        labelsLegend = []
        displayBuilding()
        displayDepots()
        displaypackages()
        updateLegend()
        updateStats()
    }
}

function onDownload(e){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "updatedpackages.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function onChange(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event){
    data = JSON.parse(event.target.result);
    currentBuilding = "1";
    currentFinishedbuildings = 0;
    for (const [id, info] of Object.entries(data.buildings)) {
        if (info.valid){
            currentFinishedbuildings +=1;
        }
    }
    informativeMarkers.clearLayers()
    packagesMarkers.clearLayers()
    labelsLegend = []
    displayBuilding()
    displayDepots()
    displaypackages()
    updateLegend()
    updateStats()
}

submitbuildingsearch.onclick = goToBuilding;
document.getElementById('file').addEventListener('change', onChange);

buttonValidateBuilding.onclick = onValidateBuilding;
buttonNextBuilding.onclick = switchToNextBuilding;
buttonSaveOutput.onclick = onDownload;

displayBuilding()
displayDepots()
displaypackages()
updateLegend()
updateStats()