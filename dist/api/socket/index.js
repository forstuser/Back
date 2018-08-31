'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let connected_socket, modals;

class SocketServer {
  constructor(props) {
    const io = _socket2.default.listen(props.server.listener);
    modals = props.models;
    io.on('connection', socket => {
      connected_socket = socket;
      console.log({ msg: 'welcome', id: socket.id });
      socket.on('init', SocketServer.init);
    });
  }

  static async init(data) {
    if (data.is_seller) {
      await modals.sellers.update({ socket_id: connected_socket.id }, { where: { id: data.id } });
    } else {
      await modals.users.update({ socket_id: connected_socket.id }, { where: { id: data.id } });
    }

    connected_socket.to(connected_socket.id).emit('registered', { socket_id: connected_socket.id });
  }

}
exports.default = SocketServer;