const speechToText = require("./server/speechRecognition.js");
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

io.on("connection", async (socket) => {
  const sockets = Array.from(await io.allSockets());
  const others = sockets.filter((a) => a !== socket.id);
  socket.emit("selfConnect", { self: socket.id, others: others });
  socket.broadcast.emit("userConnect", socket.id);
  console.log("numsockets: " + sockets.length);

  socket.on("pitchEvent", (msg) => {
    socket.broadcast.emit("pitchEvent", msg);
  });

  socket.on("speechRecognition", async (blob) => {
    try {
      let parsedSpeech = await speechToText(blob);
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

  socket.on("switchColors", (msg) => {
    socket.strokeColor = msg.stroke;
    socket.fillColor = msg.fill;
  })
  
  socket.on("newPicture", (msg) => {
    socket.broadcast.emit("newPicture", msg);
    // console.log(msg.image);
  });

  socket.on('disconnect', async () => {
    const sockets = Array.from(await io.allSockets());
    socket.broadcast.emit("userDisconnect", socket.id);
    console.log("numsockets: " + sockets.length);
  });
})

http.listen(process.env.PORT, () => {
  console.log('listening on *:' + process.env.PORT);
});