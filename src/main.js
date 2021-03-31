require("dotenv").config();
import * as Tone from 'tone';
import { newSynth, playSound } from "./synth.js";
import { randomInRange, linspace } from "./utils.js";
import { handleRecording } from "./record.js";
import { updateMeterCount } from "./controls.js";

const Pitchfinder = require("pitchfinder");
const io = require('socket.io-client');
var socket = io(process.env.SOCKET_URL);
const detectPitch = new Pitchfinder.YIN();
const p5Start = require("./visuals.js");

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
let myID = "";

function newUser(id) {
  users[id] = {};
  users[id].sound = newSynth();
  return users[id];
}

socket.on("selfConnect", (ids) => {
  users = {};
  self = newUser(ids.self);
  myID = ids.self;
  for (let id of ids.others) {
    newUser(id);
  }
  // readjustPan(-1, 1, Tone.context.currentTime);
  updateUserCount(users);
  p5Start("indiv-canvas", socket);
});

socket.on("userConnect", (id) => {
  newUser(id);
  // readjustPan(-1, 1, Tone.context.currentTime);
  updateUserCount(users);
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
  updateUserCount(users);
});

function updateUserCount(users) {
  const keys = Object.keys(users);
  document.querySelector(".user-count").innerHTML = "Users on server: " + keys.length;
  updateMeterCount(keys);
  readjustPan(-1, 1, Tone.context.currentTime);
}

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

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Calculate pitch contents
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

socket.on("pitchEvent", (msg) => {
  playSound(msg, users[msg.id].sound, msg.id);
});

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
    playSound(retval, self.sound, myID);
    retval.id = myID;
    socket.emit("pitchEvent", retval);
    // return retval;
  }
}

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Controls
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

document.querySelector(".init-audio").addEventListener("click", () => {
  console.log("initialized!");
  Tone.context.resume();
}, { once: true });

let micInterval = null;
document.querySelector(".initialize").addEventListener("click", () => {
  if (mic.state == "stopped") {
    Tone.context.resume();
    mic.open().then(() => {
      handleRecording(mult, socket);
      micInterval = setInterval(handleMic, 100);
    }).catch(e => {
      console.log("something failed");
      console.log(e);
    });
  } else {
    mic.close();
    clearInterval(micInterval);
  }
});

let meterParent = document.getElementById("user-meters");
meterParent.addEventListener("volumeChange", (e) => {
  console.log(e);
  users[e.detail.id].sound.channel.volume.rampTo(e.detail.multiplier);
  // users[e.detail.id].sound.channel.volume.rampTo(e.detail.value, 0.01, Tone.context.currentTime);
  // Tone.getDestination().volume.rampTo(e.target.value, 0.1, Tone.context.currentTime);
})

// document.querySelector("#master").addEventListener("change", (e) => {
//   Tone.getDestination().volume.rampTo(e.target.value, 0.1, Tone.context.currentTime);
// });

// document.querySelector("#mute").addEventListener("change", (e) => {
//   SELF_MUTE = e.target.checked;
// });