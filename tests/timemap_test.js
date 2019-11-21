const _ = require('underscore');
const util = require('util');
const fs = require('fs');
const assert = require('assert'); // ONLY for tests, for operations, use requie('fast-deep-equal')
const timemap = require('../apis/timemap');

/* NB: if not using $ npm test (ie, invoking tests directly),
 *		 you may need to change these paths
 * */
const DATA = './tests/timemap_data2/';
const REQ_IN = DATA + 'timemap_req_in.json';
const REQ_CMP = DATA + 'timemap_req_cmp.json';
const RES_CMP = DATA + 'timemap_res_cmp.json';
const PAS_CMP = DATA + 'timemap_pas_cmp_all.json';

module.exports = function(){
	console.log('\n=== TRAVELTIME UNIT TESTS ===\n');
	testBuildBody();
	testFetchSearches();
	testParseSearchResultsAllIds();
	testParseSearchResultsEachId();
}

function testBuildBody(){
		console.log("\nTest: Build Body\n");
    let req_in = JSON.parse(fs.readFileSync(REQ_IN));
    let req_cmp = JSON.parse(fs.readFileSync(REQ_CMP));
    let body = timemap.buildBody(req_in);
    try{
      assert.deepStrictEqual(body, req_cmp);
			console.log(`\nUsing test-cmp data from ${DATA}`);
      console.log("\nActual API request body matches expected");
    }
    catch(err){
			console.log(err);
    }
};

/*

NB: it is highly advisable to populate timemap_res_cmp.json
using recently obtained values pulled from PostMan (or an equivalent tool).
If this test fails, try populating timemap_res_cmp.json with the
freshest results possible from an outside REST parsing tool

*/
async function testFetchSearches(){
		console.log("\nTest: Fetch Searches\n");
    let req_in = JSON.parse(fs.readFileSync(REQ_IN));
    let res_cmp = JSON.parse(fs.readFileSync(RES_CMP));
    try{
      var res_rcvd = await timemap.fetchSearches(req_in);
    }
    catch(err){
      console.log('\n',err);
      return;
    }
    try{
      assert.deepStrictEqual(res_rcvd, res_cmp);
      console.log("\nActual API response matches expected");
    }
    catch(err){
			console.log(err);
    }
};

async function testParseSearchResultsEachId(){
		console.log("\nTest: Parse Search Results by Id\n");
		try{
			let res_cmp = JSON.parse(fs.readFileSync(RES_CMP));
			var pas_res = await timemap.parseSearchResults(res_cmp);
			var {ids} = pas_res;
			var id_res, tmp_cmp;
			for (let id of ids){
				id_res = await timemap.parseSearchResults(res_cmp, id);
				tmp_cmp = res_cmp.filter(n => n.search_id === id)[0];
				tmp_cmp = {ids: [tmp_cmp.search_id],
									 shells: tmp_cmp.shapes.map(n => n.shell),
									 holes: tmp_cmp.shapes.map(n => n.holes.flat(1))};
				assert.deepStrictEqual(id_res,tmp_cmp);
			}
			console.log(`Using test-cmp data from ${DATA}`);
			console.log('Actual parsed by id results match expected');
		}
		catch(err){
			console.log(err);
		}
}

async function testParseSearchResultsAllIds(){
		console.log("\nTest: Parse Search Results for All Ids\n");
		try{
			let res_cmp = JSON.parse(fs.readFileSync(RES_CMP));
			let pas_cmp = JSON.parse(fs.readFileSync(PAS_CMP));
			var pas_res = await timemap.parseSearchResults(res_cmp);
			assert.deepStrictEqual(pas_res,pas_cmp);
			console.log(`Using test-cmp data from ${DATA}`);
			console.log('Actual parsed results match expected');
		}
		catch(err){
			console.log(err);
		}
}
