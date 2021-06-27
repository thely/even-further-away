import express from 'express';

import { createServer } from 'http';
import { Server } from "socket.io";

import ServerPieceManager from "./server/ServerPieceManager.js";
import { speechToText, initSpeechSocket } from "./server/speechRecognition.js";

const app = express();
const http = createServer();
const io = new Server(http);
const piece = new ServerPieceManager(pieceStateChange);

function pieceStateChange(section) {
  io.sockets.emit("serverAsTransport", section);
  console.log(section);
}

function authenticate(req, res, next) {
  const reject = () => {
    res.setHeader('www-authenticate', 'Basic');
    res.sendStatus(401);
  } 

  const auth = req.headers.authorization;
  if (!auth) {
    return reject();
  }

  const [user, pass] = Buffer.from(auth.replace('Basic ', ''), 'base64').toString().split(':');
  if (!((user === process.env.USER1 || user == process.env.USER2) && pass === process.env.PASSWORD)) {
    return reject();
  }
  
  return next();
}

app.set("view engine", "pug");
// app.use(authenticate);
app.use(express.static('client'));

app.get('/', authenticate, (req, res) => {
  res.render('index');
});

app.get('/viewer', (req, res) => {
  res.render('viewer');
});

io.on("connection", async (socket) => {
  const room = socket.handshake.headers.referer.includes("viewer") ? "viewers" : "performers";
  socket.join(room);

  const performers = Array.from(await io.in("performers").allSockets());

  if (room == "performers") {
    socket.emit("selfConnect", { self: socket.id, users: performers });
    socket.broadcast.emit("userConnect", socket.id);
  } else {
    socket.emit("viewerConnect", { users: performers });
  }

  if (performers.length > 1) {
    socket.needsPieceState = true;
    console.log(performers);
    io.to(performers[0]).emit("askForPieceState", socket.id);
  }
  
  console.log("numsockets: " + performers.length);
  // initSpeechSocket();

  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  // Piece state/Transport
  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

  socket.on("sendPieceState", (obj) => {
    io.to(obj.to).emit("receivePieceState", obj.state);
  });

  socket.on("startTransport", () => {
    // piece.startPiece();
    io.sockets.emit("startTransport");
  })

  socket.on("stopTransport", () => {
    io.sockets.emit("stopTransport");
  });

  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  // Pitch + Speech
  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

  socket.on("pitchEvent", (msg) => {
    socket.broadcast.emit("pitchEvent", msg);
  });

  socket.on("pitchPattern", (msg) => {
    socket.broadcast.emit("pitchPattern", msg);
  });

  socket.on("speechRecognition", async (blob) => {
    try {
      let parsedSpeech = await speechToText(socket, blob);
      console.log(parsedSpeech);

      io.sockets.emit("parsedSpeech", { 
        id: socket.id, 
        speech: parsedSpeech, 
        stroke: socket.strokeColor,
        fill: socket.fillColor
      });
    } catch(e) {
      console.log(e);
    }
  });

  socket.on("speechReturn", (msg) => {
    console.log("inside speechReturn");
    console.log(msg);
  });

  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  // Images
  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

  socket.on("switchColors", (msg) => {
    socket.strokeColor = msg.stroke;
    socket.fillColor = msg.fill;
  })
  
  socket.on("newPicture", (msg) => {
    socket.broadcast.emit("newPicture", msg);
    // console.log(msg.image);
  });

  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  // Connection
  // ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

  socket.on('disconnect', async () => {
    // const sockets = Array.from(await io.allSockets());
    if (room == "performers") {
      socket.broadcast.emit("userDisconnect", socket.id);
    }
    // console.log("numsockets: " + sockets.length);
  });
})

http.listen(process.env.PORT, () => {
  console.log('listening on *:' + process.env.PORT);
});