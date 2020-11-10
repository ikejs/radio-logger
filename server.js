require('dotenv').config({ path: '.env' });
const Interstice = require('interstice');
const acrcloud = require("acrcloud");
const fs = require("fs");

// add stations
const stations = [
  { 
    _id: "abcdefgsunny",
    callSign: "WFDL",
    url: "https://ice24.securenetsystems.net/WFDL" 
  },
  { 
    _id: "abcdefgtherock",
    callSign: "WTCX",
    url: "https://ice24.securenetsystems.net/WTCX" 
  },
  { 
    _id: "abcdefgam1170",
    callSign: "WFDLAM",
    url: "https://ice24.securenetsystems.net/WFDLAM" 
  },
  { 
    _id: "abcdefggreat98",
    callSign: "WMDC",
    url: "https://ice24.securenetsystems.net/WMDC" 
  }
]


// keep track of current songs to prevent duplicate logging
const lastPlayed = {};

// instantiate ACRCloud API
const { 
  host, 
  access_key, 
  access_secret 
} = process.env;

const acr = new acrcloud({ 
  host, 
  access_key, 
  access_secret 
});


const rip = (stations) => {
  stations.map(station => {

    const { _id, callSign, url } = station;
    const folderPath = `./temp/${_id}`;

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath); // create folder for station if not created already
    const interstice = new Interstice({ output: folderPath }); // set audio recording output

    interstice.on('song:start', res => { 
      // console.log(`recording to /${res.filePath}`);
      setTimeout(() => {
        const sample = fs.readFileSync(res.filePath); // send snippet to recognition API
        acr.identify(sample).then(metadata => {
          if(metadata.metadata?.music[0]?.title) {
            if(lastPlayed[_id] != metadata.metadata.music[0].title) { // don't log if song is still playing
              console.log(metadata.metadata.music[0].title); // output current song data
              lastPlayed[_id] = metadata.metadata.music[0].title // update lastPlayed
            }
          } else {
            console.log(`There is no music right now on ${callSign}`)
          }
          fs.unlink(res.filePath, (err) => err ? console.log(err) : false); // delete temp audio file
        });
      }, 3000); // listen to station for x seconds
    });
    interstice.start(url); // start downloading audio
  })
}


// start logs when program runs
rip(stations);

// loop
setInterval(() => {
  rip(stations);
}, 150000) // 2.5 minutes
