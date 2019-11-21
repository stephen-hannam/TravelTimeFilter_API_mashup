const fetch = require('node-fetch');
const util = require('util');

const APP_ID = process.env.TRAVEL_TIME_APP_ID;
const API_KEY = process.env.TRAVEL_TIME_API_KEY;
const TT_API_EP = process.env.TRAVEL_TIME_TIMEMAP_ENDPOINT;

/**
 * args:
 * searchType: departure_search, arrival_search, [unions, intersections: not yet covered]
 *  -> searchId: unique per search, string
 * coords:
 *  -> lat: number
 *  -> lng: number
 * transportation:
 *  -> type: cycling, driving, public_transport, walking, bus, train, ferry
 * travel_time: in seconds, max 14400 (4 hours)
 * (for departure_search) departure_time: extended ISO-8601 format, ex: 2017-10-18T08:00:00Z
 * range: disab;led by default
 *  -> enabled: boolean
 *  -> width: in seconds (window following depart/arrive time)
 * (for arrival_search) arrival_time: extended ISO-8601 format, ex: 2017-10-18T08:00:00Z
 */

module.exports = {
  fetchSearches,
  buildBody,
  parseSearchResults
};

function parseSearchResults(api_results, id=undefined){
    return new Promise((resolve,reject) => {
        var ids = api_results.map(n => n.search_id);
        try{
            if (id){
                let n = ids.indexOf(id);
                var results = [api_results[n]];
            }
            else{
                var results = api_results;
            }
            ids = results.map(n => n.search_id);
            var shapes = results.map(n => n.shapes);
            var shells = shapes.map(n => n.map(n => n.shell));
            shells = shells.flat(1);
            var holes = shapes.map(n => n.map(n => n.holes));
            holes = holes.flat(1);

            resolve({ids: ids, shells: shells, holes: holes});
        }
        catch(err){
          reject(new Error(err));
        }
    });
}

function fetchSearches(searches){
    let body = buildBody(searches);
    return new Promise((resolve,reject) => {
        fetch(TT_API_EP, {
            method: 'post',
            headers:
            {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Application-Id': APP_ID,
                'X-Api-Key': API_KEY
            },
            body: JSON.stringify(body),
        })
        .then(res => res.json())
        .then(json => resolve(json.results))
        .catch(err => {
            reject(new Error(err));
        });
    });
};

function buildBody(searches){
    var body = {};
    for (let search of searches){
        appendSearch(search,body);
    }
    return body;
};


function appendSearch(search,body){
    const {stype,id,lat,lng,
           trans_type,pt_time,
           trav_time,width,
           search_ids,properties} = search;
    var skey = "";
    switch(stype){
        case 'arrive':
          skey = "arrival_searches";
          var pt_handle = "arrival_time";
        break;
        case 'depart':
          skey = "departure_searches";
          var pt_handle = "departure_time";
        break;
        case 'intersect':
          skey = "intersections";
        break;
        case 'union':
          skey = "unions";
        break;
    }
    if (!body[skey]) body[skey] = [];
    body[skey].push({
        "id": id,
        "coords": {
            "lat": lat,
            "lng": lng
        },
        "transportation": {
            "type": trans_type
        },
        "travel_time": parseInt(trav_time)*60,
        "range": {
            "enabled": (parseInt(width) !== undefined),
            "width": parseInt(width)*60
        },
        "search_ids": search_ids,
        "properties": properties
    });
    if (pt_time !== undefined){
      body[skey][body[skey].length-1][pt_handle] = pt_time;
    }
    if (search_ids === undefined){
      delete body[skey][body[skey].length-1]["search_ids"];
    }
    if (width === undefined || parseInt(width) === 0){
      delete body[skey][body[skey].length-1]["range"];
    }
    if (trav_time === undefined){
      delete body[skey][body[skey].length-1]["travel_time"];
    }
    if (properties === undefined){
      delete body[skey][body[skey].length-1]["properties"];
    }
    if (trans_type === undefined){
      delete body[skey][body[skey].length-1]["transportation"];
    }
    if (lat === undefined || lng === undefined){
      delete body[skey][body[skey].length-1]["coords"];
    }
}
