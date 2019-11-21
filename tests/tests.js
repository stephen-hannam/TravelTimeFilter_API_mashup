/* NB: if not using $ npm test (ie, invoking tests directly),
 *		 you may need to change these paths
 * */
const confResult = require('dotenv').config({ path: `${process.cwd()}/configs/.env` });

if(confResult.error){
  throw confResult.error;
}
const timemap_test = require('./timemap_test');
const gmap_test = require('./gmap_test');
const seifa_test = require('./seifa_test');

all_tests();

function all_tests(){
  //timemap_test();
  //gmap_test();
  seifa_test();
}
