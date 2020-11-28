const socketio = require('socket.io');

let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

const assignGuestName = (socket, guestNumber, nickNames, namesUsed) => {
  let name = `guest${guestNumber}`;

  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    succes: true,
    name: name
  });

  namesUsed.push(name);

  return guestNumber++;
};

const joinRoom = (socket, room) => {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {
    room: room
  });
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} joined to room: ${room}.`
  })

  let usersInRoom = io.sockets.clients(room);
  if(usersInRoom.length > 1) {
    let usersInRoomSummary = `Users list in room ${room}: `;
    for (let index in usersInRoom) {
      let userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {
      text: `${usersInRoomSummary}`
    })
  }


};

const handleNameChangeAttempts = (socket, nickNames, namesUsed) => {
  socket.on('nameAttempt', (name) => {
    if (name.indexOf('guest') === 0) {
      socket.emit('nameResult', {
        succes: false,
        message: `Username cannot start with "${name}"`
      })
    } else {
      if (namesUsed.indexOf(name) === -1) {
        let previousName = nickNames[socket.id];
        let previousNameIndex = namesUsed.indexOf(previousName);

        namesUsed.push(name);
        nickNames[socket.id] = name;

        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          succes: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: `${previousName} change name on: ${name}.`
        });
      } else {
        socket.emit('nameResult', {
          succes: false,
          message: 'This name is already taken by another user'
        });
      }
    }
  })
};

const handleMessageBroadcasting = (socket) => {
  socket.on('message', (message) => {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`
    })
  })
};



exports.listen = (server) => {
  io = socketio.listen(server);
  io.setMaxListeners('log level', 1);

  io.sockets.on('connection', (socket) => {
    guest = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');

    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', () => {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed)
  })
}; 