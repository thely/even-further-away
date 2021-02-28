import * as Tone from 'tone';
const Pitchfinder = require("pitchfinder");
const io = require('socket.io-client');
var socket = io("http://localhost:8000");
const detectPitch = new Pitchfinder.YIN();

let notes = ["C", "D", "E", "F", "G", "A"];

const meter = new Tone.Meter();
const mic = new Tone.UserMedia();
const mult = new Tone.Multiply(12);
const analysis = new Tone.Waveform(1024);

mic.connect(mult);
mult.fan(meter, analysis);

let recSet = [];
let SELF_MUTE = false;

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Socket listeners
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
let users = { };
let self = { };

// NOTE: You haven't added in a synth for the user yet.
socket.on("selfConnect", (ids) => {
  self = ids.self;
  for (let id of ids.others) {
    users[id] = {};
    users[id].sound = newSynth();
  }
  readjustPan(-1, 1, Tone.context.currentTime);
});

socket.on("userConnect", (id) => {
  users[id] = {};
  users[id].sound = newSynth();
  readjustPan(-1, 1, Tone.context.currentTime);
  // console.log(users[id].sound);
});

socket.on("userDisconnect", (id) => {
  if (!id in users || !"sound" in users[id]) {
    return;
  }

  let synth = users[id].sound;
  synth.channel.volume.value = 0;
  for (let piece of Object.keys(synth)) {
    synth[piece].dispose();
  }
  delete users[id];
  console.log(users);
});

socket.on("pitchEvent", (msg) => {
  playSound(msg, users[msg.id].sound.synth);
});

function readjustPan(min, max, time) {
  let index = 0;
  let length = Object.keys(users).length;
  let panVals = linspace(min, max, length);
  for (let id of Object.keys(users)) {
    let channel = users[id].sound.channel;
    channel.pan.setValueAtTime(panVals[index], time);
    index++;
  }
}

function linspace(startValue, stopValue, cardinality) {
  if (cardinality == 1) {
    return [0];
  }

  var arr = [];
  var step = (stopValue - startValue) / (cardinality - 1);
  for (var i = 0; i < cardinality; i++) {
    arr.push(startValue + (step * i));
  }
  return arr;
}

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Play pitches back
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

function playSound(msg, synth) {
  if ("harmonicity" in msg) {
    synth.harmonicity.setValueAtTime(msg.harmonicity, Tone.context.currentTime);
  } 
  if ("modulationIndex" in msg) {
    synth.modulationIndex.rampTo(msg.modulationIndex.value, msg.modulationIndex.duration, Tone.context.currentTime);
  }
  if ("volume" in msg) {
    synth.volume.rampTo(msg.volume, 0.01, Tone.context.currentTime);
  }
  if (msg.event == "start") {
    synth.triggerAttack(msg.pitch, Tone.context.currentTime);
  } else if (msg.event == "transition") {
    synth.frequency.rampTo(msg.pitch, 0.01, Tone.context.currentTime);
  } else if (msg.event == "end") {
    synth.triggerRelease(Tone.context.currentTime);
  }
}

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Calculate pitch contents
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
let pitchHappening = false;
let stopCounter = 0;
let changeCounter = 0;

function handleMic() {
  if (SELF_MUTE) {
    return;
  }

  let pitch = detectPitch(analysis.getValue());
  let retval = "";
  if (pitch < 10000) {
    if (pitchHappening && pitch != null) {
      retval = { event: "transition", pitch: pitch, time: Tone.context.currentTime + 0.01 };
    } else {
      pitchHappening = true;
      let harmon = randomInRange(4, 1);
      retval = { event: "start", pitch: pitch, time: Tone.context.currentTime, harmonicity: harmon };
    }

    retval.volume = meter.getValue(); 

    if (changeCounter % 5 == 0 && changeCounter != 0) {
      let newmod = randomInRange(60, 2);
      retval.modulationIndex = { value: newmod, duration: 0.5 };
    }
    changeCounter++;
  }
  else {
    stopCounter++;
    if (stopCounter > 3 && pitchHappening) {
      stopCounter = 0;
      changeCounter = 0;
      pitchHappening = false;
      retval = { event: "end", time: Tone.context.currentTime };
    }   
  }

  if (retval != "") {
    // recSet.push(retval);
    // playSound(retval);
    retval.id = self;
    socket.emit("pitchEvent", retval);
    // return retval;
  }
}

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Synth declaration
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

function newSynth(id) {
  let synth = new Tone.FMSynth({
    frequency: 200,
    oscillator: {
      type: "sawtooth",
      partialCount: 2,
    },
    modulationIndex: 100,
    modulation: {
      frequency: 4,
      type: "square",
    },
    modulationEnvelope: {
      attack: 2,
      attackCurve: "linear",
      decay: 0.1,
      decayCurve: "exponential",
      release: 1,
      releaseCurve: "exponential",
      sustain: 1
    },
    modulationEnvelope: {
      attack: 0.1,
      attackCurve: "linear",
      decay: 0.1,
      decayCurve: "exponential",
      release: 1,
      releaseCurve: "exponential",
      sustain: 1
    },
  });
  const filter = new Tone.Filter({
    frequency: 2000, 
    type: "lowpass",
    Q: 2,
    rolloff: -24
  });
  const bitcrush = new Tone.Distortion(0.5);
  const channel = new Tone.Channel(-12, -0.2).toDestination();
  synth.chain(bitcrush, filter, channel);

  return { synth: synth, distortion: bitcrush, filter: filter, channel: channel };
}


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Controls
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

let micInterval = null;
document.querySelector(".initialize").addEventListener("click", () => {
  if (mic.state == "stopped") {
    mic.open().then(() => {
      console.log("about to handle recording");
      handleRecording();
      console.log("mic open");
      // console.log(stream);
      recSet = [];
      micInterval = setInterval(handleMic, 100);
      
    }).catch(e => {
      console.log("something failed");
      console.log(e);
    });
  } else {
    mic.close();
    clearInterval(micInterval);
    // console.log(recSet);
  }
});

let record = document.querySelector(".startRecord");
let endRecord = document.querySelector(".stopRecord");

function handleRecording() {
  console.log("inside handleRecording");
  let streamDestination = Tone.getContext().createMediaStreamDestination();
  mult.connect(streamDestination);
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
    document.querySelector(".clipsZone").appendChild(audio);
    audio.controls = true;
    console.log("adding it to the html file, let's see if this changes");
    
    let blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
    chunks = [];
    let audioURL = URL.createObjectURL(blob);
    audio.src = audioURL;
    console.log("recorder stopped");
    console.log("test log to change");
  }

  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
  }
}

// let recording = false;
// document.querySelector(".startRecord").addEventListener("click", (e) => {
//   Tone.getDestination().volume.rampTo(e.target.value, 0.1, Tone.context.currentTime);
// });

document.querySelector("#master").addEventListener("change", (e) => {
  Tone.getDestination().volume.rampTo(e.target.value, 0.1, Tone.context.currentTime);
});

document.querySelector("#mute").addEventListener("change", (e) => {
  SELF_MUTE = e.target.checked;
});

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Old stuff
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

const synth2 = new Tone.MetalSynth({
  harmonicity: 1.15,
  modulationIndex: 20,
});

const channel2 = new Tone.Channel(-10, 0.2).toDestination();
synth2.connect(channel2);

let loopBeat = new Tone.Loop(stepFunc, '4n').start(0);
Tone.Transport.stop();

let beatCounter = 0;
function stepFunc(time) {
  let note1 = notes[Math.floor(Math.random() * notes.length)];
  let note2 = notes[Math.floor(Math.random() * notes.length)];
  // let freq = Tone.Frequency(`${note1}3`).toFrequency();
  synth2.triggerAttackRelease(`${note1}1`, "8n", time);
}

function bigSet(inst, params, time) {
  for (let key of Object.keys(params)) {
    // inst[key].value = params[key];
    inst[key].setValueAtTime(params[key], time);
  }
}

// plosives: p, t, k/c, d, b, g, q
// vowels: a, e, i, o, u, 
// buzzies: r, m, n, l, w, y, v
let plosives = {
  "p": {
    frequency: 1000,
    harmonicity: 5.3,
    modulationIndex: 100,
  },
  "t": {
    frequency: 487,
    harmonicity: 1.8,
    modulationIndex: 58.4
  },
  "k": {
    harmonicity: 1.15,
    modulationIndex: 10,
  },
  "c": {
    frequency: 300,
    harmonicity: 3
  },
  "d": {
    frequency: 1000,
    modulationIndex: 200
  },
  "b": {
    frequency: 580,
    harmonicity: 0.5,
    modulationIndex: 20
  },
  "g": {
    frequency: 690,
    modulationIndex: 12,
    harmonicity: 2.1
  },
  "q": {
    frequency: 285,
    harmonicity: 0.5,
    modulationIndex: 20
  },
  "v": {
    frequency: 1900,
    harmonicity: 1,
    modulationIndex: 2
  }
}

// noise: x, s, h, j, f, z
let noise = {
  "x": {
    frequency: 1000,
    harmonicity: 5.3,
    modulationIndex: 100,
  },
  "s": {
    frequency: 487,
    harmonicity: 1.8,
    modulationIndex: 58.4
  },
  "h": {
    harmonicity: 1.15,
    modulationIndex: 10,
  },
  "j": {
    frequency: 300,
    harmonicity: 3
  },
  "f": {
    frequency: 1000,
    modulationIndex: 200
  },
  "z": {
    frequency: 580,
    harmonicity: 0.5,
    modulationIndex: 20
  }
}

function randomInRange(max, min) {
  if (min == null) min = 0;
  return Math.random() * max + min;
}