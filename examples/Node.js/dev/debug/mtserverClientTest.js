'use strict';
var requester,
  zmq = require('zmq');

requester = zmq.socket('req');
requester.connect('tcp://127.0.0.1:5555');
// requester.connect('ipc://../clients.ipc');

requester.on('message', function (msg) {
  console.log(new Date(), 'received: ', msg.toString());
  requester.close();
});

requester.send('Hello');
