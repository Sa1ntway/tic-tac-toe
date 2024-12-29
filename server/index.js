const http = require("http");
const express = require("express");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.Server(app).listen(8080);
const io = socketIo(server);

app.use(express.static(__dirname + "/../client/"));

let players = {};
let unmatchedPlayerId;

function getOpponentSocket(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  const opponentSocketId = players[socket.id].opponent;
  return players[opponentSocketId].socket;
}

io.on("connection", function (socket) {
  console.log("New client connected. ID: ", socket.id);

  joinPlayer(socket);

  if (getOpponentSocket(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    getOpponentSocket(socket).emit("game.begin", {
      symbol: players[getOpponentSocket(socket).id].symbol,
    });
  }

  socket.on("make.move", function (data) {
    console.log(data);
    if (!getOpponentSocket(socket)) {
      return;
    }
    socket.emit("move.made", data);
    getOpponentSocket(socket).emit("move.made", data);
  });
  socket.on("disconnect", function () {
    console.log("Client disconnected. ID: ", socket.id);
    if (getOpponentSocket(socket)) {
      getOpponentSocket(socket).emit("opponent.left");
    }
  });
});

function joinPlayer(socket) {
  players[socket.id] = {
    opponent: unmatchedPlayerId,
    symbol: "X",
    socket: socket,
  };
  if (unmatchedPlayerId) {
    players[socket.id].symbol = "O";
    players[unmatchedPlayerId].opponent = socket.id;
    unmatchedPlayerId = null;
  } else {
    unmatchedPlayerId = socket.id;
  }
}
