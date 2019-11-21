module.exports = {
    extractLatLng,
    extractNames,
    getAddrComp,
    getFormattedAddresses,
    getLatLngCenters,
    getViewPorts,
    getPlaceIds,
};

function extractLatLng(response){
    let resArr = [];
    for (let i = 0; i < response.json.results.length; i++) {
        resArr[i] = response.json.results[i].geometry.location;
    }
    return resArr;
}

function extractNames(response){
    let resArr = [];
    for (let i = 0; i < response.json.results.length; i++) {
        resArr[i] = response.json.results[i].name;
    }
    return resArr;
}

function getPlaceIds(response){
	return new Promise((resolve,reject)=>{
		if(response.json.status === "OK"){
			const resArr = [];
			for (let i = 0; i < response.json.results.length; i++) {
			    resArr[i] = response.json.results[i].place_id;
			}
			if(typeof resArr !== 'undefined' && resArr.length > 0){
				resolve(resArr);
			}
			else{
				reject(new Error('could not extract place ids from json response'));
			}
		}
		else{
				reject(new Error(response.json.status));
		}
	});
}

function getViewPorts(response){
	return new Promise((resolve,reject)=>{
		if(response.json.status === "OK"){
			const resArr = [{ne: {lat: undefined, lng: undefined},
						     sw: {lat: undefined, lng: undefined}}];
			for (let i = 0; i < response.json.results.length; i++) {
			    resArr[i].ne.lat = response.json.results[i].geometry.viewport.northeast.lat;
			    resArr[i].ne.lng = response.json.results[i].geometry.viewport.northeast.lng;
			    resArr[i].sw.lat = response.json.results[i].geometry.viewport.southwest.lat;
			    resArr[i].sw.lng = response.json.results[i].geometry.viewport.southwest.lng;
			}
			if(typeof resArr !== 'undefined' && resArr.length > 0){
				resolve(resArr);
			}
			else{
				reject(new Error('could not extract view ports from json response'));
			}
		}
		else{
				reject(new Error(response.json.status));
		}
	});
}

function getLatLngCenters(response){
	return new Promise((resolve,reject)=>{
		if(response.json.status === "OK"){
			const resArr = [{lat : undefined, lng: undefined}];
			for (let i = 0; i < response.json.results.length; i++) {
			    resArr[i].lat = response.json.results[i].geometry.location.lat;
				resArr[i].lng = response.json.results[i].geometry.location.lng;
			}
			if(typeof resArr !== 'undefined' && resArr.length > 0){
				resolve(resArr);
			}
			else{
				reject(new Error('could not extract centers from json response'));
			}
		}
		else{
				reject(new Error(response.json.status));
		}
	});
}

//const util = require('util');

function getAddrComp(response,type_key){
	return new Promise((resolve,reject)=>{
		if(response.json.status === "OK"){
			const resArr = [];
			for (let i = 0; i < response.json.results.length; i++) {
          //console.log(util.inspect(response,false,null,true));
          let addrComps = response.json.results[i].address_components;
          while(addrComps.length > 0){
              let addrComp = addrComps.pop();
              if(addrComp.types.includes(type_key)){
                  resArr[i] = addrComp.long_name;
                  break;
              }
          }
			}
			if(typeof resArr !== 'undefined' && resArr.length > 0){
				resolve(resArr);
			}
			else{
				reject(new Error('could not extract post codes from json response'));
			}
		}
		else{
				reject(new Error(response.json.status));
		}
	});
}

function getFormattedAddresses(response){
	return new Promise((resolve,reject)=>{
		if(response.json.status === "OK"){
			const resArr = [];
			for (let i = 0; i < response.json.results.length; i++) {
			    resArr[i] = response.json.results[i].formatted_address;
			}
			if(typeof resArr !== 'undefined' && resArr.length > 0){
				resolve(resArr);
			}
			else{
				reject(new Error('could not extract formatted addresses from json response'));
			}
		}
		else{
				reject(new Error(response.json.status));
		}
	});
}
