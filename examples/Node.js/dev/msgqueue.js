/*
 * @fileoverview Simple message queuing broker
 *    Same as request-reply broker but using QUEUE device
 * @author Octavian Ionescu <itavyg(at)gmail(dot)com>
 */
'use strict';
var frontend, backend,
  zmq = require('zmq');

frontend = zmq.socket('router');
frontend.bind('tcp://localhost:5559');
backend = zmq.socket('dealer');
backend.bind('tcp://localhost:5560');

zmq.proxy(frontend, backend);

process.on('SIGINT', function () {
  frontend.close();
  backend.close();
});
