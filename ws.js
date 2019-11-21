const {createServer} = require('wss');

const util = require('util');
const fs = require('fs');

const geolib = require('geolib');
const lod = require('lodash');
const timemap = require('./apis/timemap');
const gmap_places = require('./apis/gmap_places');
const gmap_utils = require('./apis/gmap_utils');
const seifas = require('./apis/abs_seifas');

const PROXY_SHELL_AREA = process.env.PROXY_SHELL_AREA;

const wsport = process.env.WSPORT || 10001;

createServer(function connectionListener (ws){
    ws.send('welcome!');
    ws.on('message', msg => processMsgIn(msg,ws));
})
.listen(wsport,function(){
    const {address, port} = this.address();
    console.log(`websocket listening on port ${wsport}`);
});

const savedSearchQueries = {};

async function processMsgIn(msgIn,ws){
    try{
        const msg = JSON.parse(msgIn);
        const {id,stype} = msg;
				const {newSearchAddr,keyword,IDXTS,MEASS} = msg;
				const details = {
					ws:ws,keyword:keyword,
					IDXTS:IDXTS,MEASS:MEASS
				};

        if(stype === 'arrive' || stype === 'depart'){
          msg.pt_time += ':00Z';
          // geocode to get latlng of newSearchAddr
          try{
            const geoRes = await gmap_places.geocodeAddress(newSearchAddr);
            const latlngArr = await gmap_utils.extractLatLng(geoRes);
            const {lat,lng} = latlngArr[0];
            if(lat === 'undefined' || lng === 'undefined'){
              throw new Error('lat and/or lng undefined');
            }
						ws.send(JSON.stringify(['cplaces', [{latlng:{lat:lat,lng:lng},content:{addr:newSearchAddr,name:id}}]]));

						const searchQuery = { ...msg };
            searchQuery.lat = lat;
            searchQuery.lng = lng;
						fetchAndRespond([searchQuery],details);
						savedSearchQueries[id] = searchQuery;
          }
          catch(err){
            console.log(err);
          }
        }
        else if(stype === 'union' || stype === 'intersect'){
					const searchQueryArr = [];
					const {search_ids} = msg;
					const thisSearchQuery = {stype:stype,id:id,search_ids:[ ...search_ids ]};
					pullSavedSearches(search_ids,searchQueryArr);
					const centers = [];
					for(let searchQuery of searchQueryArr){
						if(searchQuery.stype === 'arrive' || searchQuery.stype === 'depart'){
							let center = {
								latlng:{lat:searchQuery.lat,lng:searchQuery.lng},
								content:{addr:searchQuery.newSearchAddr,name:searchQuery.id}
							};
							centers.push(center);
						}
					}
					ws.send(JSON.stringify(['cplaces', centers]));

					searchQueryArr.push(thisSearchQuery);
					details['id'] = id;
					fetchAndRespond(searchQueryArr,details);
					savedSearchQueries[id] = thisSearchQuery;
        }
        else{ // unrecognized stype
					console.log(`Server does not recognize stype: ${stype}`);
					ws.send('huh?');
        }
    }
    catch(err){
        console.log(msgIn);
    }
}

function pullSavedSearches(search_ids,searchQueryArr){
	const nestedSearch_ids = [];
	for(let search_id of search_ids){
		if(savedSearchQueries[search_id].stype === 'union'
		|| savedSearchQueries[search_id].stype === 'intersect'){
			pushSavedSearches(search_ids,searchQueryArr);
			nestedSearch_ids.push(savedSearchQueries[search_id].search_ids);
		}
		else{
			searchQueryArr.push(savedSearchQueries[search_id]);
		}
	}
	search_ids = [...search_ids, ...nestedSearch_ids.flat(Infinity)];
}

async function buildSEIFAs(places,IDXTS,MEASS){
	const seifaArr = {};
	for(let apoc of lod.uniq([ ...places.map(n => n.poc) ])){
		try{
			let seifaRes = await seifas.fetchSEIFA(apoc,IDXTS,MEASS);
			let parsed_seifa = seifas.parseFetchResponse(seifaRes,apoc);
			seifaArr[apoc] = parsed_seifa;
		}
		catch(err){
			let rej = {};
			for(let idxts of IDXTS){
				rej[idxts] = {};
				for(let meass of MEASS){
					rej[idxts][meass] = 'NA';
				}
			}
			seifaArr[apoc] = rej;
			console.log('ws/buildSEIFAs() err: ',err);
		}
	}
	return seifaArr;
}

async function preparePlaces(shells,keyword){
	let places = {};
	let proxyShells = splitShells(shells);
	for(let proxyShell of proxyShells){
		try{
			if(proxyShell.length < 3){
				continue;
			}
			let {latitude,longitude} = geolib.getCenterOfBounds(proxyShell);
  		let radius =
				await Math.max
  		  .apply(Math, proxyShell.flat(Infinity)
  		  	.map(loc => geolib.getDistance({latitude,longitude},loc)));// in meters
			// google places restricts max to 3 pages of 20 on its end
			if(radius >= 50000){
				radius = 49999;
			};
  		let {coords,pocs,names,addrs} =
  			await gmap_places.gmapPlaces({lat:latitude,lng:longitude},radius,keyword);
			coords.map((loc,i) => {
					let key = [loc.lat.toString(),loc.lng.toString()].join("");
					if(!places[key])
						places[key] = {coords:loc,pocs:pocs[i],names:names[i],addrs:addrs[i]};
			});
		}
		catch(err){
			console.log('ws/preparePlaces() err: ', err);
		}
	}
	return places;
}

function splitShells(shells){
	let proxyShells = [];
	for(let shell of shells){
		try{
			let shellArea = geolib.getAreaOfPolygon(shell);
			if(shellArea > PROXY_SHELL_AREA){
				let factor = Math.ceil(shellArea/PROXY_SHELL_AREA);
				let segPtLen = Math.floor(shell.length/factor);
				let start = 0;
				let stop = segPtLen + 1;
				for(let i = 0; i < factor; i++){
					proxyShells.push(shell.slice(start,stop));
					start = stop;
					stop += segPtLen;
				}
				if(shell.slice(stop).length > 2){
					proxyShells.push(shell.slice(stop));
				}
			}
			else{
				proxyShells.push(shell);
			}
		}
		catch(err){
			console.log('ws/splitShells() err: ',err);
		}
	}
	return proxyShells;
}

async function fetchAndRespond(searchQueryArr,details){
	try{
		let {ws,keyword,IDXTS,MEASS,id} = details;
    let timemapRes = await timemap.fetchSearches(searchQueryArr);
    let {ids,shells,holes} =
      await timemap.parseSearchResults(timemapRes,id);
    ws.send(JSON.stringify(['shapes', [ ...shells ]]));
		let places = await preparePlaces(shells,keyword);
    let {inplaces,outplaces} =
      await gmap_places.placePlaces(shells,holes,places);
		let inSEIFAs = await buildSEIFAs(inplaces,IDXTS,MEASS);
		inplaces =
			inplaces.map(place => ({
				latlng:place.coord,
				content:{
					name:place.name,
					poc:place.poc,
					addr:place.addr,
					seifa:inSEIFAs[place.poc]}
			}));
		//console.log(util.inspect(inplaces,false,null,true));
    ws.send(JSON.stringify(['inplaces', inplaces ]));

		let outSEIFAs = await buildSEIFAs(outplaces,IDXTS,MEASS);
		outplaces =
			outplaces.map(place => ({
				latlng:place.coord,
				content:{
					name:place.name,
					poc:place.poc,
					addr:place.addr,
					seifa:outSEIFAs[place.poc]}
			}));
		//console.log(util.inspect(outplaces,false,null,true));
    ws.send(JSON.stringify(['outplaces', outplaces ]));

	}
	catch(err){
		console.log('ws/fetchAndRespond() err: ', err);
	}
}
