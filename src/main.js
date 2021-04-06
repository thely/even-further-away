require("dotenv").config();
import * as Tone from 'tone';
// import { newSynth, playSound, repeaterSynth } from "./synth.js";
import { randomInRange, linspace } from "./utils.js";
// import { handleRecording } from "./record.js";
import { updateMeterCount } from "./controls.js";
// import { p5Start, updateCanvasTunerPitch } from "./visuals.js";
import VisualHandler from "./VisualHandler.js";
import MicInput from './MicManager.js';
import UserSynth from './UserSynth.js';
import PatternBuilder from './PatternBuilder.js';


// const Pitchfinder = require("pitchfinder");
const io = require('socket.io-client');
var socket = io(process.env.SOCKET_URL);
let micInput;
const patternBuilder = new PatternBuilder();
// const detectPitch = new Pitchfinder.YIN();
// const p5Start = require("./visuals.js");

let notes = ["C", "D", "E", "F", "G", "A"];

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Socket listeners
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
let users = { };
let self = { };
let myID = "";

function newUser(id) {
  users[id] = new UserSynth(id);
  users[id].repeaterEventNum = -1;
  return users[id];
}

socket.on("selfConnect", (ids) => {
  users = {};
  myID = ids.self;

  self = newUser(myID);
  for (let id of ids.others) {
    newUser(id);
  }

  updateUserCount(users);
  micInput = new MicInput(myID);
  // p5Start("indiv-canvas", socket);
});

socket.on("userConnect", (id) => {
  newUser(id);
  updateUserCount(users);
});


socket.on("userDisconnect", (id) => {
  if (!id in users || !"sound" in users[id]) {
    return;
  }

  users[id].destroy();

  delete users[id];
  console.log(users);
  updateUserCount(users);
});

function updateUserCount(users) {
  const keys = Object.keys(users);
  document.querySelector(".user-count").innerHTML = "Users on server: " + keys.length;
  updateMeterCount(keys);
  readjustPan(-1, 1, Tone.now());
}

function readjustPan(min, max, time) {
  let index = 0;
  let length = Object.keys(users).length;
  let panVals = linspace(min, max, length);
  let panVals2 = linspace(min + 0.1, max - 0.1, length);
  for (let id of Object.keys(users)) {
    users[id].rePan(panVals[index]);
    // users[id].sound.channel.pan.setValueAtTime(panVals[index], time);
    // users[id].repeater.channel.pan.setValueAtTime(panVals2[index], time);
    index++;
  }
}

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Calculate pitch contents
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

socket.on("pitchEvent", (msg) => {
  playSound(msg, users[msg.id].sound, msg.id, playBlip, pieceState);
  // updateCanvasTunerPitch(msg.pitch);
});

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Controls
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

document.querySelector(".init-audio").addEventListener("click", (e) => {
  try {
    console.log("initialized!");
    Tone.context.resume();
    e.target.style.backgroundColor = "lightgreen";
    e.target.disabled = true;
  } catch(err) {
    console.log(err);
    e.target.style.backgroundColor = "pink";
  }
  
}, { once: true });

let visualHandler;
document.querySelector(".init-camera").addEventListener("click", () => {
  visualHandler = new VisualHandler("indiv-canvas");
  visualHandler.openCamera();
  // p5Start("indiv-canvas", socket);
});

const startButton = document.querySelector(".piece-start");
startButton.addEventListener("click", () => {
  socket.emit("startTransport");
});

socket.on("startTransport", () => {
  console.log("starting transport");
  Tone.Transport.start();
  startPiece();
  startButton.style.backgroundColor = "lightgreen";
  startButton.disabled = true;
});

function addRecordingAsElement(blob) {
  let audio = document.createElement('audio');
  audio.setAttribute('controls', '');
  document.querySelector(".clipsZone").appendChild(audio);
  audio.controls = true;
  audio.src = URL.createObjectURL(blob);
}

document.addEventListener('keydown', (e) => {
  if (e.code == "Space") {
    micInput.startRecording();
    patternBuilder.startCollecting();
    
  }
});

document.addEventListener('keyup', async (e) => {
  if (e.code == "Space") {
    const blob = await micInput.stopRecording();
    // addRecordingAsElement(blob);
    const pattern = patternBuilder.stopCollecting();
    users[myID].playPattern(pattern.pitches, pattern.duration);
    socket.emit("pitchPattern", {
      id: myID,
      pitches: pattern.pitches,
      duration: pattern.duration
    });
  }
})

function usePitchAnalysis(val) {
  // users[val.id].playSinger(retval, self.sound, myID, playBlip, pieceState);
  users[val.id].playSinger(val);
  patternBuilder.addItem(val);
  socket.emit("pitchEvent", val);
}

document.querySelector(".initialize").addEventListener("click", async (e) => {
  const retval = await micInput.changeMicState(usePitchAnalysis);
  if (retval) {
    e.target.style.backgroundColor = "lightgreen";
  } else {
    e.target.style.backgroundColor = "pink";
  }
});

let meterParent = document.getElementById("user-meters");
meterParent.addEventListener("volumeChange", (e) => {
  console.log(e);
  users[e.detail.id].sound.channel.volume.rampTo(e.detail.multiplier);
  // users[e.detail.id].sound.channel.volume.rampTo(e.detail.value, 0.01, Tone.context.currentTime);
  // Tone.getDestination().volume.rampTo(e.target.value, 0.1, Tone.context.currentTime);
})

const noiseSynth = new Tone.NoiseSynth({ volume: -20 });
const filter = new Tone.Filter(8000, "highpass");
const bitcrush = new Tone.BitCrusher(4);
const autoPanner = new Tone.AutoPanner("1n");
noiseSynth.chain(bitcrush, filter, autoPanner, Tone.Destination);

document.querySelector(".blippy").addEventListener("click", (e) => {
  playBlip();
});

function playBlip(time) {
  filter.frequency.value = Math.random() * 7000 + 4000;
  bitcrush.wet.value = Math.min(Math.random() + 0.5, 1);
  noiseSynth.volume.value = Math.random() * -20 - 10;

  noiseSynth.triggerAttackRelease(0.005, time + 0.01);
}

let pieceState = {
  useRepeater: false,
  noiseWhileSpeaking: false,
  noiseAsBGBursts: false,
};

const dirBox = document.querySelector(".directions");

function startPiece() {
  burstHappening = false;

  Tone.Transport.scheduleRepeat((time) => {
    // console.log("first section");
    // pieceState.useRepeater = true;
    noiseBursts(time, 3, 7);
    dirBox.innerHTML = "Speak only one word at a time, and record any time you speak.";
  }, "2n", 0.1, 60);

  Tone.Transport.scheduleRepeat((time) => {
    console.log("in section two");
    pieceState.useRepeater = true;
    noiseBursts(time, 5, 6);
    dirBox.innerHTML = "Speak three words at a time. When you record, you should hear yourself back in a different synth.";
  }, "2n", 60.1, 60);

  Tone.Transport.scheduleRepeat((time) => {
    console.log("section 3");
    noiseBursts(time, 6, 5);
    pieceState.noiseWhileSpeaking = true;
    dirBox.innerHTML = "Talk frequently in a normal voice. Record yourself intermittently, for ~3 words at a time.";
  }, "2n", 120.1, 60);
}

let burst = 5;
let burstHappening = false;
function noiseBursts(time, burstCount, burstFrequency) {
  // console.log("section repeat");
  const randval = Math.random() * 10;
  console.log(randval);
  console.log(burstHappening);
  if (randval >= burstFrequency && !burstHappening) {
    console.log("about to schedule burst repeat");
    burstHappening = true;
    burst = burstCount;

    const cancelMe = Tone.Transport.scheduleRepeat((time2) => {
      console.log("burst repeat");
      if (burst <= 0) {
        burstHappening = false;
        Tone.Transport.clear(cancelMe);
      }

      if (Math.random() * 10 >= 4) {
        playBlip(time2);
        burst--;
      }
    }, "16n", Tone.Transport.position, 10);
  }
}