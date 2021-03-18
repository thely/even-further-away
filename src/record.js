import * as Tone from 'tone';
const { detect } = require('detect-browser');

let record = document.querySelector(".startRecord");
let endRecord = document.querySelector(".stopRecord");

function setMimeType() {
  const browser = detect();
  if (browser.name == 'firefox') {
    return "audio/ogg;codecs=opus";
  } else {
    return "audio/webm";
  }
}

function handleRecording(source, socket) {
  let codec = setMimeType();
  console.log(codec);
  console.log("inside handleRecording");
  let streamDestination = Tone.getContext().createMediaStreamDestination();
  source.connect(streamDestination);
  let mediaRecorder = new MediaRecorder(streamDestination.stream, { mimeType: codec});
  let chunks = [];

  record.onclick = function() {
    mediaRecorder.start();
    console.log(mediaRecorder.state);
  }
  endRecord.onclick = function() {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
  }

  mediaRecorder.onstop = function(e) {
    let clipName = "mytest";
    let audio = document.createElement('audio');
    audio.setAttribute('controls', '');
    // document.querySelector(".clipsZone").appendChild(audio);
    audio.controls = true;
    
    let blob = new Blob(chunks, { 'type': codec });
    let retval = { blob: blob, codec: codec };
    chunks = [];
    audio.src = URL.createObjectURL(blob);
    // console.log(audio.src);
    socket.emit("speechRecognition", retval);
  }

  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
  }
}

export { handleRecording };