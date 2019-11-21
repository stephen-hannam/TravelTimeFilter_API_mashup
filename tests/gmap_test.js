const _ = require('underscore');
const util = require('util');
const fs = require('fs');
const assert = require('assert'); // ONLY for tests, for operations, use requie('fast-deep-equal')
const gmapPlaces = require('../apis/gmap_places');
const gmapGeometry = require('../apis/gmap_utils');

const DATA = './tests/gmap_data1/';
const REQ_IN = DATA + 'address_req_in.json';
const RES_CMP = DATA + 'geocode_res_cmp.json';
const ALL_CMP = DATA + 'all_res_cmp.json';

module.exports = function(){
    console.log('\n=== GMAP UNIT TESTS ===\n');
		testGeocodeAddress();
};

async function testGeocodeAddress(){
		try{
				let {address} = JSON.parse(fs.readFileSync(REQ_IN));
				let res_cmp = JSON.parse(fs.readFileSync(RES_CMP));
				let response = gmapPlaces.geocodeAddress(address);
        response
          .then(obj => {
            try{
                assert.deepStrictEqual(obj.json,res_cmp.json);
                console.log(`\nUsing test-cmp data from ${DATA}`);
                console.log("\nActual gmaps geocode response matches expected");
            }
            catch(err){
                console.log(err);
                console.log(util.inspect(obj,false,null,true));
            }
          })
          .catch(err => console.log(err));
		}
		catch(err){
				console.log(err);
		}
}

