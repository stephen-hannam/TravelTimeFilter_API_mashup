const cIcon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
const inIcon = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
const outIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

function addShape(waypoints) {
	var polygon = new google.maps.Polygon({
  	paths: waypoints,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#00FF00',
    fillOpacity: 0.35
	});
	currShapes.push(polygon);
}

function createMarker(placeMarker, iconImg){
	var marker = new google.maps.Marker({
  	position: placeMarker.latlng,
  	map: map,
		icon: iconImg,
		clicked: false
	});
  if(placeMarker.content){
  	var infoWindow = new google.maps.InfoWindow({
    	content:buildInfoContent(placeMarker.content),
  	});
		infoWindow.addListener('closeclick', function(){
			marker.clicked = false;
		});
		marker.addListener('click', function(){
			marker.clicked = true;
			infoWindow.open(map,marker);
		});
		marker.addListener('mouseover', function(){
			infoWindow.open(map,marker);
		});
		marker.addListener('mouseout', function(){
			if(!marker.clicked){
				infoWindow.close(marker);
			}
		});
  }
  return marker;
}

function addInMarker(placeMarker) {
	currInMarkers.push(createMarker(placeMarker, inIcon));
	setInMarker();
}

function addOutMarker(placeMarker) {
	currOutMarkers.push(createMarker(placeMarker,outIcon));
	setOutMarker();
}

function addCMarker(placeMarker) {
	currCMarkers.push(createMarker(placeMarker,cIcon));
	setCMarker();
}

function buildInfoContent(content){
	let contentStr = '<div id="content">'
		+ '<p>Click to Fix InfoWindow</p>'
		+ '<div id="siteNotice"></div>'
		+ '<h4 id="firstHeading" classHeading>'
		+ content.name + '</h4>'
		+ '<div id="bodyContent">' + '<p>'
		+ content.addr + '</p>';
  if(content.seifa){
    contentStr += json2table(content.seifa);
  }
  return contentStr + '</div></div>';
}

function setInMarker(){
	currInMarkers[currInMarkers.length-1].setMap(map);
}

function setOutMarker(){
	currOutMarkers[currOutMarkers.length-1].setMap(map);
}

function setCMarker(){
	currCMarkers[currCMarkers.length-1].setMap(map);
}

function clearInMarkers() {
	for(let placeMarker of currInMarkers){
		placeMarker.setMap(null);
	}
	currInMarkers = [];
}

function clearOutMarkers() {
	for(let placeMarker of currOutMarkers){
		placeMarker.setMap(null);
	}
	currOutMarkers = [];
}

function clearCMarkers() {
	for(let placeMarker of currCMarkers){
		placeMarker.setMap(null);
	}
	currCMarkers = [];
}

function clearShapes() {
	for(let currShape of currShapes){
		currShape.setMap(null);
	}
	currShapes = [];
}

function procShapes(shapesArr){
	if(getSelectValues(selSearchType)[0] !== 'reload'){
    pWaitingOn.innerHTML = 'This may take some time === Waiting on In-places and Out-places === NB: Google limits search radius to 50km';
		searchShapes.push(shapesArr);
	}
	for(let shape of shapesArr){
		addShape(shape);
	}
	for(let currShape of currShapes){
		currShape.setMap(map);
	}
}


function procInMarkers(markersArr){
	if(getSelectValues(selSearchType)[0] !== 'reload'){
    pWaitingOn.innerHTML = 'Waiting on Out-places';
		searchInMarkers.push(markersArr);
	}
  markersArr.map(mark => addInMarker(mark));
}

function procOutMarkers(markersArr){
	if(getSelectValues(selSearchType)[0] !== 'reload'){
    pWaitingOn.innerHTML = 'Idle';
		searchOutMarkers.push(markersArr);
	}
  markersArr.map(mark => addOutMarker(mark));
}

function procCMarkers(markersArr){
	if(getSelectValues(selSearchType)[0] !== 'reload'){
    pWaitingOn.innerHTML = 'Waiting on Shapes, In-places and Out-places';
		searchCMarkers.push(markersArr);
	}
  markersArr.map(mark => addCMarker(mark));
}

ee.addListeners({
  'cplaces':procCMarkers,
	'inplaces':procInMarkers,
	'outplaces':procOutMarkers,
	'shapes':procShapes
});


function json2table(jsonStats){
	let placeStatsTable = emptyStatsTable;
	for(let indxs in jsonStats){
		for(let meass in jsonStats[indxs]){
			let tableEntry = indxs + meass;
			if(placeStatsTable.includes(tableEntry)){
				placeStatsTable = placeStatsTable.replace(tableEntry,jsonStats[indxs][meass]);
			}
		}
	}
	for(let indxs of selIDXTS.options){
		for(let meass of selMEASS.options){
			let tableEntry = indxs.value + meass.value;
			placeStatsTable = placeStatsTable.replace(tableEntry,'---');
		}
	}
	return placeStatsTable;
}
