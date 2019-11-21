const confResult = require('dotenv').config({ path: `${process.cwd()}/configs/.env` });
if(confResult.error){
  throw confResult.error;
}
const express = require('express');
const morgan = require('morgan');
const ws = require('./ws.js');
const fs = require('fs');

const app = express();

app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));

function init(){
    let content = fs
      .readFileSync('./public/genindex','utf8')
      .replace(/GMAPKEY/g,process.env.GMAP_API_KEY)
      .replace(/HOSTIP/g,process.env.HOSTIP)
      .replace(/STARTLAT/g,process.env.STARTLAT)
      .replace(/STARTLNG/g,process.env.STARTLNG);
    fs.writeFileSync('./public/index.html',content,'utf-8');
}

app.get('/', function(req,res){
  res.sendFile(__dirname + '/public/index.html');
});

const port = process.env.PORT || 3000;

function start(){
  try{
    init();
  }
  catch(err){
    console.log(err);
  }
}

start();
app.listen(port, () => {console.log(`listening on port ${port}...`);});
