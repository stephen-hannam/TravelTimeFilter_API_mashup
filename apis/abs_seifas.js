const fetch = require('node-fetch');
const lod = require('lodash');

const SEIFA_EP = process.env.ABS_SEIFA_ENDPOINT;
const POCRE = "POC";
const IDXTRE = "IDXT";
const MEASRE = "MEAS";
const ALTPOCS = [-1,1,-2,2];

const OBSIDRE = "SEIFAINDEXTYPE";
const VALIDRE = "SEIFA_MEASURE";
const POCIDRE = "POA";
/*

fixed: SEIFA 2016 by Postal Area Code
fixed: Detail = Data Only
fixed: Dimension at observation level = All dimensions
set by script: postal area code
multi-selectable by user: Index Type + Measure -> as a GUI table

HANDLE: no post code error:
  --> HTTP status 400
  --> "dataSets": []

*/

module.exports = {
	fetchSEIFA,
	parseFetchResponse,
  buildURL
};

function fetchSEIFA(poc,idxts,meass,url=undefined){
    return new Promise(async (resolve,reject) => {
        if (!url){
            var ep = await buildURL(poc,idxts,meass);
        }
        else{
            var ep = url;
        }
        fetch(ep, {method: 'get'})
        .then(async res => {
            if (res.status == 200){
              resolve(res.json());
            }
            else{
              reject(`${res.status}: unable to get stats for postcode ${poc}`);
            }
        })
        .catch(err => reject(err));
    });
};

/*
 * It is especially important to make this parsing function below be robust to changes in the ABS API
 * as this API is still in beta, therefore condensing the API response JSON should be done by filtering on key
 * names in key-value pairs, rather than relying on numeric index positions in arrays, and these field names
 * should be stored elsewhere as constant macros/variables for ease of adjustment should they change.
 *
 * This function is still sensitive to structural changes in the API repsonse, but generalizing to various structural
 * changes is viewed as over-optimizing at this juncture, though one approach to doing so could be to use REGEX
 * to scrape the API response object.
 * */

function parseFetchResponse(res,poc){
  let obs =
    res.dataSets[
    res.structure.dimensions.observation
    .findIndex(n => {return function(){return n.id.values.id == poc;}})]
    .observations;
  let dims =
    res.structure.dimensions.observation
    .filter(n => (n.id === OBSIDRE) || (n.id === VALIDRE))
    .map(n => {
      const obj = {};
      const valIds = n.values.map(n => n.id);
      obj["keyPosition"] = n.keyPosition;
      obj["id"] = n.id;
      obj["values"] = valIds;
      return obj;
    });
	let obsVals = Object.values(obs);
	let table =
    Object.keys(obs)
		.map(n => n.split(":").map(n => parseInt(n)))
		.map((n,i) => {return (function(n,i){
				return [dims.map(m => [m["values"][n[m["keyPosition"]]]]),obsVals[i]].flat(Infinity)
			})(n,i)
		});
  return(nestObjFlds(table));
}


// function nestObjFlds below:
// adapted from user '1983's code found at: https://stackoverflow.com/questions/38381685/recursively-add-object-properties

function nestObjFlds([xs, ...yss], obj = {}){
	function nestInner([x, ...xs], obj = {}){
		return (xs.length === 0) ? x : (obj[x] = nestInner(xs, obj[x]), obj);
	}
	return (xs === undefined) ? obj : nestObjFlds(yss, nestInner(xs, obj));
}

async function buildURL(poc,idxts,meass){
    return new Promise((resolve,reject) => {
        try{
            let idxts_url = idxts.join("+");
            let meass_url = meass.join("+");
            let url =
              SEIFA_EP
              .replace(POCRE,poc)
              .replace(IDXTRE,idxts_url)
              .replace(MEASRE,meass_url);
            resolve(url);
        }
        catch(err){
            reject(err);
        }
    });
};
