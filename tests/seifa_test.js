const _ = require('underscore');
const util = require('util');
const fs = require('fs');
const assert = require('assert'); // ONLY for tests, for operations, use requie('fast-deep-equal')
const seifa = require('../apis/abs_seifas');

const DATA = './tests/seifa_data1/';
const REQ_URL = DATA + 'seifas_req_url.json';
const REQ_IN = DATA + 'seifas_req_in.json';
const REQ_CMP = DATA + 'seifas_req_cmp.json';
const RES_CMP = DATA + 'seifas_res_cmp.json';
const RES_IN = DATA + 'seifas_res_in.json';
const RES_PARSE = DATA + 'seifas_res_parsed_cmp.json';

module.exports = function(){
    console.log('\n=== ABS SEIFA UNIT TESTS ===\n');
    testBuildURL();
    testFetchSEIFAbyUrl();
    testFetchSEIFAbyMinFlds();
    testParseFetchResponse();
};

async function testBuildURL(){
    try{
        const {poc,idxts,meass} = JSON.parse(fs.readFileSync(REQ_IN));
        const {url} = JSON.parse(fs.readFileSync(REQ_CMP));
        const req_url = await seifa.buildURL(poc,idxts,meass);
        assert.deepStrictEqual(req_url,url);
        console.log('Actual build of URL matches expected\n');
    }
    catch(err){
        console.log(err);
    }
}

async function testFetchSEIFAbyUrl(){
    try{
        const {url} = JSON.parse(fs.readFileSync(REQ_URL));
        const res_cmp = JSON.parse(fs.readFileSync(RES_CMP));
        const res_json = await seifa.fetchSEIFA(null,null,null,url);
        //console.log(util.inspect(res_json,false,null,true));
        delete res_json.header;
        assert.deepStrictEqual(res_json,res_cmp);
        console.log('Got response by raw url');
        console.log('Actual ABS SEIFA response matches expected\n');
    }
    catch(err){
        console.log(err);
    }
}

async function testFetchSEIFAbyMinFlds(){
    try{
        const {poc,idxts,meass} = JSON.parse(fs.readFileSync(REQ_IN));
        const res_cmp = JSON.parse(fs.readFileSync(RES_CMP));
        const res_json = await seifa.fetchSEIFA(poc,idxts,meass);
        delete res_json.header;
        assert.deepStrictEqual(res_json,res_cmp);
        console.log('Got reponse by URL builder');
        console.log('Actual ABS SEIFA response matches expected\n');
    }
    catch(err){
        console.log(err);
    }
}

async function testParseFetchResponse(){
    try{
        const {poc,res_in} = JSON.parse(fs.readFileSync(RES_IN));
        const res_parsed_cmp = JSON.parse(fs.readFileSync(RES_PARSE));
        const res_parsed = await seifa.parseFetchResponse(res_in,poc);
        assert.deepStrictEqual(res_parsed,res_parsed_cmp);
        console.log('\nActual parsing of response matches expected\n');
    }
    catch(err){
        console.log(err);
    }
}
