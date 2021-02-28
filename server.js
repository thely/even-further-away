const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

io.on("connection", async (socket) => {
  // console.log("a user conencted");
  const sockets = Array.from(await io.allSockets());
  const others = sockets.filter((a) => a !== socket.id);
  // console.log(others);
  // console.log("you: " + socket.id);
  socket.emit("selfConnect", { self: socket.id, others: others });
  socket.broadcast.emit("userConnect", socket.id);

  socket.on("pitchEvent", (msg) => {
    socket.broadcast.emit("pitchEvent", msg);
    // console.log(msg);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit("userDisconnect", socket.id);
    // console.log('user disconnected');
  });
})

http.listen(8000, () => {
  console.log('listening on *:8000');
});