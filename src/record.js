import * as Tone from 'tone';

let record = document.querySelector(".startRecord");
let endRecord = document.querySelector(".stopRecord");

function handleRecording(source, socket) {
  console.log("inside handleRecording");
  let streamDestination = Tone.getContext().createMediaStreamDestination();
  source.connect(streamDestination);
  let mediaRecorder = new MediaRecorder(streamDestination.stream, { mimeType: "audio/ogg;codecs=opus"});
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
    
    let blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
    chunks = [];
    audio.src = URL.createObjectURL(blob);
    // console.log(audio.src);
    socket.emit("speechRecognition", blob);
  }

  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
  }
}

export { handleRecording };