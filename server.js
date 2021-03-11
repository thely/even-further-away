const speechToText = require("./server/speechRecognition.js");
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
// const axios = require('axios');

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

io.on("connection", async (socket) => {
  const sockets = Array.from(await io.allSockets());
  const others = sockets.filter((a) => a !== socket.id);
  socket.emit("selfConnect", { self: socket.id, others: others });
  socket.broadcast.emit("userConnect", socket.id);

  socket.on("pitchEvent", (msg) => {
    socket.broadcast.emit("pitchEvent", msg);
  });

  socket.on("speechRecognition", async (blob) => {
    let parsedSpeech = await speechToText(blob);
    io.sockets.emit("parsedSpeech", { id: socket.id, speech: parsedSpeech });
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit("userDisconnect", socket.id);
    // console.log('user disconnected');
  });
})

http.listen(8000, () => {
  console.log('listening on *:8000');
});