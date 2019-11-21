
window.onload = function(){
	emptyStatsTable = statsTableInit();
}

ws.onopen = function() {
    console.log('websocket is connected ...');
    ws.send('connected')
}

ws.onmessage = function(event) {
    try{
        let msg = JSON.parse(event.data);
        console.log(msg);
				setTimeout(() => {
					ee.emit(msg[0], msg[1]);
				}, 0);
    }
    catch(err){
        console.log(event.data);
        try{
          pWaitingOn.innerHTML = `${event.data}`;
        }
        catch(err){
          pWaitingOn.innerHTML = 'Idle';
        }
    }
}

function adviseUser(){
	let typeSel = getSelectValues(selSearchType)[0];
  if(typeSel === 'arrive' || typeSel === 'depart'){
    alert('Selecting active searches is only meaningful when searching by "union", "intersection" or "reloading"; for "union" or "intersection" at least 2 selections must be made.');
  }
}

function stypeChange(){
	let typeSel = getSelectValues(selSearchType)[0];

	// --- Union/Intersection ---
	if(typeSel === 'union' || typeSel === 'intersect'){
		selActiveSearches.disabled=false;
		selActiveSearches.multiple=true;
		inNewSearchAddr.disabled=true;
		inNewSearchId.disabled=false;
		selTransType.disabled=true;
		inPtTime.disabled=true;
		inTravTime.disabled=true;
		inRange.disabled=true;
		inKeyWord.disabled=true;
		selIDXTS.disabled=true;
		selMEASS.disabled=true;
		if(typeSel === 'union'){
			btnSubQuery.innerHTML = 'Submit Union';
		}
		else{
			btnSubQuery.innerHTML = 'Submit Intersection';
		}
	}
	// --- RELOAD ---
	else if(typeSel === 'reload'){
		selActiveSearches.disabled=false;
		selActiveSearches.multiple=false;
		inNewSearchId.disabled=true;
		btnSubQuery.innerHTML = 'Reload Existing';
	}
	// --- BASIC ---
	else{
		selActiveSearches.disabled=true;
		inNewSearchId.disabled=false;
		inNewSearchAddr.disabled=false;
		selTransType.disabled=false;
		inPtTime.disabled=false;
		inTravTime.disabled=false;
		inRange.disabled=false;
		inKeyWord.disabled=false;
		selIDXTS.disabled=false;
		selMEASS.disabled=false;
		btnSubQuery.innerHTML = 'Submit New';
	}
}

function showReloaded(){
	let typeSel = getSelectValues(selSearchType)[0];

	if(typeSel === 'reload'){
			let reloadSel = parseInt(getSelectValues(selActiveSearches)[0],10);

			if(reloadSel !== 'undefined'){
				reloadDetails = activeSearchDetails[reloadSel];
				for(let prop in reloadDetails){
					els = document.getElementsByName(prop);
					for(let el of els){
						if(el.tagName === 'INPUT' || els.tagName === 'SELECT'){
							el.value = reloadDetails[prop];
						}
					}
				}
			}
			else{
				console.log('showReloaded: undefined arr idx');
			}
	}
}

function updateSelActiveSearches(){
	// add to the GUI elem of searches
	let option = document.createElement("option");
	option.text = inNewSearchId.value;
	option.value = numActive-1;
	selActiveSearches.add(option);
	selActiveSearches.selectedIndex = numActive-1;
}

function submitQuery(){

	let typeSel = getSelectValues(selSearchType)[0];

  console.log(typeSel);
	if(typeSel !== 'reload' && activeSearchIds.includes(inNewSearchId.value)){
			alert("A search of this name already exists");
	}
	else{

		let searchFields = {};

		// --- Union/Intersection ---
		if(typeSel === 'union' || typeSel === 'intersect'){
      let selections = getSelectValues(selActiveSearches);
      if(selections.length < 2){
        alert("select at least 2 existing searches");
        return;
      }
      searchFields['stype'] = typeSel;
      searchFields['id'] = inNewSearchId.value;
      searchFields['keyword'] = inKeyWord.value;
      searchFields['search_ids'] =
        selections.map(n => activeSearchIds[parseInt(n)]);

			let seifasElements = formSeifas.elements;
			for(let i=0; i < seifasElements.length; i++){ // >
				searchFields[seifasElements[i].name] = getSelectValues(seifasElements[i]);
			}
		}
		// --- RELOAD ---
		else if(typeSel === 'reload'){
			let reloadSel = parseInt(getSelectValues(selActiveSearches)[0]);
      console.log(`hello: ${reloadSel}`);
			if(reloadSel === 'undefined'){
				alert('You must select an active/existing search for reloading');
				return;
			}
			else{
		    clearShapes();
		    clearInMarkers();
		    clearOutMarkers();
        clearCMarkers();
        console.log(reloadSel);
        console.log(searchShapes);
        console.log(searchCMarkers);
        console.log(searchInMarkers);
        console.log(searchOutMarkers);
				ee.emit('cplaces',searchCMarkers[reloadSel]);
				ee.emit('inplaces',searchInMarkers[reloadSel]);
				ee.emit('outplaces',searchOutMarkers[reloadSel]);
				ee.emit('shapes',searchShapes[reloadSel]);
        return;
			}
		}
		// --- BASIC ---
		else{
			let basicElements = formBasicSearch.elements;
			for(let i=0; i < basicElements.length; i++){ // >
				if(basicElements[i].tagName === 'INPUT'){
    	    searchFields[basicElements[i].name] = basicElements[i].value;
				}
				else if(basicElements[i].tagName === 'SELECT'){
					searchFields[basicElements[i].name] = getSelectValues(basicElements[i])[0];
				}
			}

			let seifasElements = formSeifas.elements;
			for(let i=0; i < seifasElements.length; i++){ // >
				searchFields[seifasElements[i].name] = getSelectValues(seifasElements[i]);
			}
		}

		clearShapes();
		clearInMarkers();
		clearOutMarkers();
    clearCMarkers();

		ws.send(JSON.stringify(searchFields));
    pWaitingOn.innerHTML = 'Waiting on Centers, Shapes, In-places and Out-places';

		if(typeSel !== 'reload'){

			activeSearchDetails.push(searchFields);
			activeSearchIds.push(inNewSearchId.value);

			if(++numActive === 1){
				let option = document.createElement("option");
				option.text = "Reload Existing Search";
				option.value = "reload";
				selSearchType.add(option);
				outNumActive.innerHTML = `Select from 1 Existing Search`;
			}
			else{
				outNumActive.innerHTML = `Select from ${numActive} Existing Searches`;
			}
			if(numActive === 2){
				let option = document.createElement("option");
				option.text = "Intersection of Searches";
				option.value = "intersect";
				selSearchType.add(option);
				option = document.createElement("option");
				option.text = "Union of Searches";
				option.value = "union";
				selSearchType.add(option);
			}

			updateSelActiveSearches();
		}
	}
}

// Return an array of the selected opion values
// select is an HTML select element
function getSelectValues(select){
	let result = [];
	let options = select && select.selectedOptions;

	for (var i=0, iLen=options.length; i<iLen; i++) { //>
	  result.push(options[i].value);
	}
	return result;
}

function statsTableInit(){
	var headerRow = '<tr><th></th><th colspan="10">Measures</th></tr>';
	var bodyRows = '<tr><td>Index</td>';
	for(let opt of selMEASS.options){
		bodyRows += '<td>' + opt.value + '</td>';
	}
	bodyRows += '</tr>';
	for(let opt of selIDXTS.options){
		bodyRows += '<tr><td>' + opt.value  + '</td>';
		for(let opt2 of selMEASS.options){
			bodyRows += '<td>' + opt.value  + opt2.value  + '</td>';
		}
		bodyRows += '</tr>';
	}
	return '<table class=""><thead><tr>'
					+ headerRow + '</tr></thead><tbody>'
					+ bodyRows + '</tbody></table>';
}
