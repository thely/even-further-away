require("dotenv").config();
import * as Tone from 'tone';
import { linspace } from "./utils.js";
// import { updateMeterCount } from "./controls.js";
import MeterBlock from "./controls.js";
import VisualHandler from "./VisualHandler.js";
import MicInput from './MicManager.js';
import UserSynth from './UserSynth.js';
import PatternBuilder from './PatternBuilder.js';
import BlipSynth from './BlipSynth.js';
import PieceManager from './PieceManager.js';
import UserList from './UserList.js';


const io = require('socket.io-client');
var socket = io(process.env.SOCKET_URL);
let micInput, blipSynth, pieceManager, visualHandler, meterBlock, userList;
const patternBuilder = new PatternBuilder();
let users = new UserList();

let notes = ["C", "D", "E", "F", "G", "A"];

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Socket listeners
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

socket.on("selfConnect", (ids) => {
  users.resetUserList(ids);

  micInput = new MicInput(ids.self);
  blipSynth = new BlipSynth();
  pieceManager = new PieceManager();
  meterBlock = new MeterBlock();
  visualHandler = new VisualHandler("indiv-canvas", socket);

  pieceManager.registerListener(blipSynth);
  pieceManager.registerListener(visualHandler);
  pieceManager.registerListener(users);

  updateUserCount();
});

socket.on("userConnect", (id) => {
  users.newUser(id);
  updateUserCount();
});


socket.on("userDisconnect", (id) => {
  users.removeUser(id);
  updateUserCount();
});

socket.on("disconnect", () => {
  users.removeAllUsers();
  pieceManager.reset();
  // if (visualHandler) {
    visualHandler.deleteAll();
  // }
});

function updateUserCount() {
  users.updateUserCount();
  meterBlock.updateMeterCount(users.keys);

  if (visualHandler) {
    visualHandler.usersChange(users.keys);
  }
}


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Transport
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

const stopButton = document.querySelector(".piece-stop");
stopButton.addEventListener("click", () => {
  socket.emit("stopTransport");
});

socket.on("startTransport", () => {
  console.log("starting transport");
  pieceManager.startPiece(blipSynth);
  startButton.style.backgroundColor = "lightgreen";
  startButton.disabled = true;
});

socket.on("stopTransport", () => {
  pieceManager.stopPiece();
  startButton.disabled = false;
  // console.log("starting transport");
  // pieceManager.startPiece(blipSynth);
  // startButton.style.backgroundColor = "lightgreen";
  // startButton.disabled = true;
});


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Microphone
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

document.querySelector(".initialize").addEventListener("click", async (e) => {
  const retval = await micInput.changeMicState(usePitchAnalysis);
  if (retval) {
    e.target.style.backgroundColor = "lightgreen";
  } else {
    e.target.style.backgroundColor = "pink";
  }
});

function usePitchAnalysis(val) {
  // users[val.id].playSinger(retval, self.sound, myID, playBlip, pieceState);
  users.getSynth(val.id).playSinger(val);
  meterBlock.updateSingleMeter(users.getSynth(val.id).singerVolume, val.id);
  patternBuilder.addItem(val);
  socket.emit("pitchEvent", val);
}

socket.on("pitchEvent", (msg) => {
  users.getSynth(msg.id).playSinger(msg);
  meterBlock.updateSingleMeter(users.getSynth(msg.id).singerVolume, msg.id);
  // updateSingleMeter(this.singer.meter.getValue(), this.id);
  // playSound(msg, users[msg.id].sound, msg.id, playBlip, pieceState);
  // updateCanvasTunerPitch(msg.pitch);
});

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Recording
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

document.addEventListener('keydown', (e) => {
  if (e.code == "Space") {
    micInput.startRecording();
    patternBuilder.startCollecting();
  }
});

document.addEventListener('keyup', async (e) => {
  if (e.code == "Space") {
    const blob = await micInput.stopRecording();
    socket.emit("speechRecognition", blob);

    const pattern = patternBuilder.stopCollecting();
    users.self.synth.playPattern(pattern.pitches, pattern.duration);
    socket.emit("pitchPattern", {
      id: users.selfID,
      pitches: pattern.pitches,
      duration: pattern.duration
    });
  }
});

socket.on("pitchPattern", (msg) => {
  users.getSynth(msg.id).playPattern(msg.pitches, msg.duration);
});


// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Canvas
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
document.querySelector(".init-camera").addEventListener("click", () => {
  // visualHandler = new VisualHandler("indiv-canvas", socket);
  visualHandler.openCamera();
  visualHandler.usersChange(users.keys);
});

socket.on("newPicture", (obj) => {
  visualHandler.frameFromServer(obj);
});

socket.on("parsedSpeech", (msg) => {
  visualHandler.textFromServer(msg);
});