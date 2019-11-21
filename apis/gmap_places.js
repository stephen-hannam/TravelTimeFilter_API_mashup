const googleMapClient = require('@google/maps').createClient({
    key: process.env.GMAP_API_KEY
});
const geolib = require('geolib');
const gmap_utils = require('./gmap_utils');
const util = require('util');
const fs = require('fs');

module.exports = {
  gmapPlaces,
  geocodeAddress,
  reverseGeocodeAddress,
  placePlaces,
  checkAllPolygons
};

function gmapPlaces(loc, r, keyword){
    return new Promise((resolve,reject) => {
        googleMapClient
        	.placesNearby(
            {location: loc, radius: r, keyword: keyword},
            async (err, response) => {
                if(!err && response.json.status == "OK"){
                    try{
                      let locs = await gmap_utils.extractLatLng(response);
											let names = await gmap_utils.extractNames(response);
											let addrs = [];
											let pocs = [];
											for(let aloc of locs){
												try{
													let revRes = await reverseGeocodeAddress(aloc);
													let apoc = await gmap_utils.getAddrComp(revRes,'postal_code');
													pocs.push(apoc[0]);
													let addr = await gmap_utils.getFormattedAddresses(revRes);
													addrs.push(addr[0]);
												}
												catch(err){
													reject(err);
												}
											}
                      resolve({coords: locs, pocs: pocs,
															 names: names, addrs: addrs});
                    }
                    catch(err){
                      reject(err);
                    }
                }
                else{
                    reject(err);
                }
            }
        );
    });
}

function geocodeAddress(address){
		return new Promise((resolve,reject) => {
				googleMapClient.geocode({address: address},
				  (err, response) => {
				    if (!err) {
				      	resolve(response);
				    }
						else{
								reject(err);
						}
				});
		});
}

function reverseGeocodeAddress(latlng){
		return new Promise((resolve,reject) => {
				googleMapClient.reverseGeocode({latlng: latlng},
				  (err, response) => {
				    if (!err) {
				      	resolve(response);
				    }
						else{
								reject(err);
						}
				});
		});
}

async function placePlaces(shells,holes,places){
  return new Promise((resolve,reject) => {
    try{
			let pkeys = Object.keys(places);
			let coords = pkeys.map(key => places[key].coords);
			let pocs = pkeys.map(key => places[key].pocs);
			let names = pkeys.map(key => places[key].names);
			let addrs = pkeys.map(key => places[key].addrs);
			let placeCoords = coords.map((n,i) => ({coord:n,poc:pocs[i],name:names[i],addr:addrs[i]}));
      let inplaces =
        placeCoords
        .filter(pt => checkAllPolygons.apply(pt.coord,[shells, []]));
      let outplaces =
        placeCoords
        .filter(pt => !inplaces.includes(pt));
      resolve({inplaces: inplaces, outplaces: outplaces});
    }
    catch(err){
      reject(err);
    }
  });
}

function checkAllPolygons(shells, holes){
    for (let hole of holes){
        if(geolib.isPointInPolygon({lat:this.lat,lng:this.lng},hole)){
            return false;
        }
    }
    for (let shell of shells){
        if(geolib.isPointInPolygon({lat:this.lat,lng:this.lng},shell)){
            return true;
        }
    }
    return false;
}

//const googleMapClient = require('@google/maps').createClient({
//    key:'AIzaSyCQZ1svnMe7q1CZlmG1APaTDhgboWHaQSI'
//});
//const latlng = '40.714224,-73.961452';
//const latlng = {lat:40.714224,lng:-73.961452};

//reverseGeocodeAddress(latlng)
//.then(res => console.log(util.inspect(res,false,null,true)))
//.catch(err => console.log(err));
//.then(res => gmap_utils.getAddrComp(res,'postal_code'))
//.then(res => console.log(util.inspect(res,false,null,true)))
//.catch(err => console.log(err));

//gmapPlaces(latlng)
//.then(res => console.log(util.inspect(res,false,null,true)))
//.catch(err => console.log(err));

//geocodeAddress('2 George St, Brisbane City QLD 4000')
//.then(res => console.log(util.inspect(res,false,null,true)))
//.catch(err => console.log);

//geocodeAddress('2 George St, Brisbane City QLD 4000')
//.then(res => gmap_utils.extractLatLng(res))
//.then(res => console.log(util.inspect(res,false,null,true)))
//.catch(err => console.log);

//geocodeAddress('2 George St, Brisbane City QLD 4000')
//.then(res => gmap_utils.extractLatLng(res))
//.then(res => reverseGeocodeAddress(res[0])
//	.then(res => gmap_utils.getFormattedAddresses(res))
//	.catch(err => console.log(err)))
//.then(res => console.log(util.inspect(res,false,null,true)))
//.catch(err => console.log);
