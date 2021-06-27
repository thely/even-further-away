// require("dotenv").config();
import * as Tone from 'tone';
// import { linspace } from "./utils.js";
// import { updateMeterCount } from "./controls.js";
import MeterBlock from "./controls.js";
import VisualHandler from "./VisualHandler.js";
import MicInput from './MicManager.js';
// import UserSynth from './UserSynth.js';
import PatternBuilder from './PatternBuilder.js';
import BlipSynth from './BlipSynth.js';
import PieceManager from './PieceManager.js';
import UserList from './UserList.js';
import BwommSynth from './BwommSynth.js';

Tone.setContext(new Tone.Context({
  latencyHint: "balanced",
}));

const io = require('socket.io-client');
var socket = io(process.env.SOCKET_URL);
let micInput, blipSynth, bwommSynth, pieceManager, visualHandler, meterBlock, users;
const patternBuilder = new PatternBuilder();

let notes = ["C", "D", "E", "F", "G", "A"];

// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
// Socket listeners
// ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

socket.on("viewerConnect", (ids) => {
  clearOldCanvas();
  users = new UserList({ "viewer": true }, Tone);
  users.resetUserList(ids);

  blipSynth = new BlipSynth(Tone);
  bwommSynth = new BwommSynth(Tone);
  pieceManager = new PieceManager(socket, Tone);
  meterBlock = new MeterBlock();
  visualHandler = new VisualHandler("indiv-canvas", socket, { "viewer": true });

  pieceManager.registerListener(blipSynth);
  pieceManager.registerListener(bwommSynth);
  pieceManager.registerListener(visualHandler);
  pieceManager.registerListener(users);

  updateUserCount();
});

socket.on("selfConnect", (ids) => {
  clearOldCanvas();
  users = new UserList(null, Tone);
  users.resetUserList(ids);

  micInput = new MicInput(ids.self, Tone);
  blipSynth = new BlipSynth(Tone);
  bwommSynth = new BwommSynth(Tone);
  pieceManager = new PieceManager(socket, Tone);
  meterBlock = new MeterBlock(Tone);
  visualHandler = new VisualHandler("indiv-canvas", socket);

  pieceManager.registerListener(blipSynth);
  pieceManager.registerListener(bwommSynth);
  pieceManager.registerListener(visualHandler);
  pieceManager.registerListener(users);

  updateUserCount();
});

function clearOldCanvas() {
  document.querySelector("#indiv-canvas").innerHTML = "";
}

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
  visualHandler.deleteAll();
  micInput.destroy();
  blipSynth.destroy();
  bwommSynth.destroy();
});

socket.on("askForPieceState", (id) => {
  socket.emit("sendPieceState", {
    state: {
      transport: Tone.Transport.position,
      ongoing: pieceManager.inProgress,
      section: pieceManager.sectionIndex,
    },
    to: id
  });
});

socket.on("receivePieceState", (state) => {
  if (state.ongoing) {
    pieceManager.joinOngoing(state);
    startButton.disabled = true;
  }
});

function updateUserCount() {
  users.updateUserCount();
  meterBlock.updateMeterCount(users.keys, users.selfID);

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
  pieceManager.startPiece();
  visualHandler.clearBoard();
  startButton.style.backgroundColor = "lightgreen";
  startButton.disabled = true;
});

socket.on("stopTransport", () => {
  pieceManager.stopPiece();
  visualHandler.fadeOut();
  startButton.style.backgroundColor = "";
  startButton.disabled = false;
});

socket.on("serverAsTransport", (section) => {
  console.log(section);
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

document.getElementById("user-meters").addEventListener("volumeChange", (e) => {
  // console.log(e.detail);
  // console.log(users.getSynth(e.detail.id));
  users.getSynth(e.detail.id).singer.channel.volume.value = e.detail.multiplier;
})

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
    if (!("error" in pattern)) {
      users.self.synth.playPattern(pattern.pitches, pattern.duration);
      socket.emit("pitchPattern", {
        id: users.selfID,
        pitches: pattern.pitches,
        duration: pattern.duration
      });
    }
  }
});

socket.on("pitchPattern", (msg) => {
  if ("pitches" in msg) {
    users.getSynth(msg.id).playPattern(msg.pitches, msg.duration);
  }
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