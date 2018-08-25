import SocketIO from 'socket.io';

let connected_socket, modals;

export default class SocketServer {
  constructor(props) {
    const io = SocketIO.listen(props.server.listener);
    modals = props.models;
    io.on('connection', (socket) => {
      connected_socket = socket;
      console.log({msg: 'welcome', id: socket.id});
      socket.on('init', SocketServer.init);
    });
  }

  static async init(data) {
    if (data.is_seller) {
      await modals.sellers.update({socket_id: connected_socket.id},
          {where: {id: data.id}});
    } else {
      await modals.users.update({socket_id: connected_socket.id},
          {where: {id: data.id}});
    }

    connected_socket.to(connected_socket.id).
        emit('registered', {socket_id: connected_socket.id});
  }

}