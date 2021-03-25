// import { Readable } from 'stream';
require("dotenv").config();
const fs = require('fs');
const Stream = require('stream');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
// const { detect } = require('detect-browser');

// function setMimeType() {
//   const browser = detect();
//   if (browser.name == 'firefox') {
//     return "audio/ogg;codecs=opus";
//   } else {
//     return "audio/webm";
//   }
// }


const speeTex = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_KEY,
  }),
  serviceUrl: process.env.WATSON_URL,
  headers: {
    'X-Watson-Learning-Opt-Out': 'true'
  }
});

async function speechToText(blob) {
  const recognizeParams = {
    objectMode: false,
    // audio: blob.blob,
    contentType: blob.codec,
    wordAlternativesThreshold: 0.9,
    // keywords: ['colorado', 'tornado', 'tornadoes'],
    // keywordsThreshold: 0.5,
  };

  const recogStream = speeTex.recognizeUsingWebSocket(recognizeParams);
  const readable = new Stream.Readable();
  readable._read = () => {};
  readable.push(blob.blob);
  readable.push(null);

  readable.pipe(recogStream);
  recogStream.setEncoding('utf8');

  recogStream.on('data', function(event) { 
    onEvent('Data:', event); 
    return event;
  });
  recogStream.on('error', function(event) { onEvent('Error:', event); });
  recogStream.on('close', function(event) { onEvent('Close:', event); });
  
  // try {
  //   let result = await speeTex.recognize(recognizeParams);
  //   let parsed = result.result.results[0].alternatives[0].transcript;
  //   console.log(parsed);
  //   return parsed;
  // } catch (err) {
  //   console.log(err);
  // }
}

function onEvent(name, event) {
  console.log(name, JSON.stringify(event, null, 2));
}

module.exports = speechToText;