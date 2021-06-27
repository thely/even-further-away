const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

let recogStream;
let hasConnected = false;

const speeTex = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_KEY,
  }),
  serviceUrl: process.env.WATSON_URL,
  headers: {
    'X-Watson-Learning-Opt-Out': 'true'
  }
});

function initSpeechSocket(codec) {
  const recognizeParams = {
    objectMode: false,
    // audio: blob.blob,
    contentType: codec,
    wordAlternativesThreshold: 0.9,
    // keywords: ['colorado', 'tornado', 'tornadoes'],
    // keywordsThreshold: 0.5,
  };

  recogStream = speeTex.recognizeUsingWebSocket(recognizeParams);
  // console.log(recogStream);
  // console.log("speech stream opened");
}

async function speechToText(mySocket, blob) {
  // initSpeechSocket(blob.codec);
  const recognizeParams = {
    objectMode: false,
    audio: blob.blob,
    contentType: blob.codec,
    wordAlternativesThreshold: 0.9,
    // keywords: ['colorado', 'tornado', 'tornadoes'],
    // keywordsThreshold: 0.5,
  };

  // const readable = new Stream.Readable();
  // readable._read = () => {};
  // readable.push(blob.blob);
  // readable.push(null);

  // readable.pipe(recogStream);
  // recogStream.setEncoding('utf8');

  // recogStream.on('data', function(event) { 
  //   onEvent('Data:', event); 
  //   mySocket.emit("speechReturn", { msg: event });
  //   return event;
  // });
  // recogStream.on('error', function(event) { onEvent('Error:', event); });
  // recogStream.on('close', function(event) { onEvent('Close:', event); });
  
  try {
    let result = await speeTex.recognize(recognizeParams);
    let parsed = result.result.results[0].alternatives[0].transcript;
    console.log(parsed);
    return parsed;
  } catch (err) {
    console.log(err);
  }
}

function onEvent(name, event) {
  console.log(name, JSON.stringify(event, null, 2));
}

// module.exports = speechToText;
module.exports = { speechToText, initSpeechSocket };