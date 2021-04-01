require("dotenv").config();
import * as Tone from 'tone';
import { newSynth, playSound, repeaterSynth } from "./synth.js";
import { randomInRange, linspace } from "./utils.js";
import { handleRecording } from "./record.js";
import { updateMeterCount } from "./controls.js";
import { p5Start, updateCanvasTunerPitch } from "./visuals.js";

const Pitchfinder = require("pitchfinder");
const io = require('socket.io-client');
var socket = io(process.env.SOCKET_URL);
const detectPitch = new Pitchfinder.YIN();
// const p5Start = require("./visuals.js");

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
  users[id].repeater = repeaterSynth();
  users[id].repeaterEventNum = -1;
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
  users[id].repeater.channel.volume.value = 0;
  for (let piece of Object.keys(synth)) {
    synth[piece].dispose();
  }
  for (let piece of Object.keys(users[id].repeater)) {
    users[id].repeater[piece].dispose();
  }

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
    users[id].sound.channel.pan.setValueAtTime(panVals[index], time);
    users[id].repeater.channel.pan.setValueAtTime(panVals2[index], time);
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
    // if (pitch == null && Math.random() * 10 >= 6) {
    //   playBlip();
    // }

    // updateCanvasTunerPitch(pitch);
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
    playSound(retval, self.sound, myID, playBlip, pieceState);
    retval.id = myID;
    if (localRecord) {
      localPattern.push(retval);
    }
    socket.emit("pitchEvent", retval);
    // return retval;
  }
}

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

let localRecord = false;
let localPattern = [];
let localCurve = [];

document.addEventListener('keydown', (e) => {
  // console.log(e);
  if (e.code == "Space" && pieceState.useRepeater && !localRecord) {
    localRecord = true;
    localPattern = [];
    localCurve = [];
  }
});

document.addEventListener('keyup', (e) => {
  // console.log(e);
  if (e.code == "Space" && pieceState.useRepeater && localRecord) {
    localPattern = formatLocalPattern(localPattern);
    console.log(localPattern);
    localRecord = false;
  }
})

document.querySelector(".record-pattern").addEventListener("click", () => {
  if (localRecord) {
    localPattern = formatLocalPattern(localPattern);
    console.log(localPattern);
  } else {
    localPattern = [];
    localCurve = [];
  }

  localRecord = !localRecord;
});

function formatLocalPattern(notes) {
  const timeOff = notes[0].time;
  let retval = [];
  for (let note of notes) {
    if (note.event == "transition" || note.event == "start" && note.pitch !== null) {
      retval.push([note.time - timeOff, note.pitch]);
      localCurve.push(note.pitch);
    }
  }

  socket.emit("pitchPattern", {
    id: myID,
    duration: retval[retval.length - 1][0],
    pitches: localCurve
  });

  eventNum = playPattern(
    users[myID].repeater.synth, 
    localCurve, 
    retval[retval.length-1][0], 
    eventNum
  );

  return retval;
}

let eventNum = -1;
document.querySelector(".play-pattern").addEventListener("click", () => {
  eventNum = playPattern(
    users[myID].repeater.synth, 
    localCurve, 
    localPattern[localPattern.length-1][0], 
    eventNum
  );
});

function playPattern(osc, pitches, duration, eventNum) {
  if (eventNum != -1) {
    Tone.Transport.clear(eventNum);
  }

  eventNum = Tone.Transport.scheduleRepeat((time) => {
    osc.start(time).stop(time + duration);
    osc.frequency.setValueCurveAtTime(pitches, time, duration);
    console.log(Tone.Transport.position);
  }, "2m", Tone.Transport.position);

  return eventNum;
}

socket.on("pitchPattern", (msg) => {
  users[msg.id].repeaterEventNum = playPattern(
      users[msg.id].repeater.synth, 
      msg.pitches, 
      msg.duration, 
      users[msg.id].repeaterEventNum
  );
});

let micInterval = null;
document.querySelector(".initialize").addEventListener("click", (e) => {
  if (mic.state == "stopped") {
    Tone.context.resume();
    mic.open().then(() => {
      e.target.style.backgroundColor = "lightgreen";
      handleRecording(mult, socket);
      micInterval = setInterval(handleMic, 100);
    }).catch(e => {
      console.log("something failed");
      console.log(e);
    });
  } else {
    mic.close();
    e.target.style.backgroundColor = "pink";
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