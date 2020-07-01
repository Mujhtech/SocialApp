const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const http = require('http');
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());

const { addUser, removeUser, getUser, getUserInRoom } = require('./users');

const router = require('./router');

const server = http.createServer(app);
const io = socketio(server);

io.on('connect', (socket) => {
   socket.on('join', ({ name, room }, callback) => {
      const { error, user } = addUser({ id: socket.id, name, room });

      if(error) return callback(error);

      socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
      socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined!`});

      socket.join(user.room);

      io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room)});

      callback();
   });

   socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id);

      io.to(user.room).emit('message', { user: user.name, text: message});

      callback();
   });

   socket.on('disconnect', () => {
      const user = removeUser(socket.id);

      if(user){
         io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left`});
         io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room)});
      }
   });
});

app.use(router);

server.listen(PORT, () => console.log(`Server running in port ${PORT}`));