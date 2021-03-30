const { speechToText, initSpeechSocket } = require("./server/speechRecognition.js");
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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

app.use(authenticate);
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
  // initSpeechSocket();

  socket.on("pitchEvent", (msg) => {
    socket.broadcast.emit("pitchEvent", msg);
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
  })

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