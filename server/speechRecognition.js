require("dotenv").config();
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

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
    audio: blob,
    contentType: 'audio/ogg;codecs=opus',
    wordAlternativesThreshold: 0.9,
    // keywords: ['colorado', 'tornado', 'tornadoes'],
    // keywordsThreshold: 0.5,
  };
  
  try {
    let result = await speeTex.recognize(recognizeParams);
    let parsed = result.result.results[0].alternatives[0].transcript;
    console.log(parsed);
    return parsed;
  } catch (err) {
    console.log(err);
  }
}

module.exports = speechToText;