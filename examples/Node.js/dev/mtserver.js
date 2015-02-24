/*
 * @fileoverview Multithreaded Hello World server. it uses
 *  cluster module since nodejs is singlethreaded
 * @author Octavian Ionescu <itavyg(at)gmail(dot)com>
 */
'use strict';
var clients, workers, k, setupProxy, receiver,
  c, cleanExit,
  startedWorkers = 0,
  zmq = require('zmq'),
  cluster = require('cluster');


cleanExit = function () {
  if (0 === startedWorkers) {
    // no more workers
    workers.close();
  }
};

setupProxy = function () {
  clients = zmq.socket('router');
  clients.bind('tcp://127.0.0.1:5555');

  workers = zmq.socket('dealer');
  workers.bind('ipc://workers.ipc');

  zmq.proxy(clients, workers);
};

if (cluster.isMaster) {
  // start forking after we setup the proxy
  (function () {

    for (k = 0; 5 > k; k += 1) {
      cluster.fork();
    }

    cluster.on('fork', function (/*worker*/) {
      startedWorkers += 1;
    });

    cluster.on('exit', function (/*worker, code, signal*/) {
      startedWorkers -= 1;
      cleanExit();
    });

  }(setupProxy()));
} else {

  receiver = zmq.socket('rep');
  receiver.connect('ipc://workers.ipc');

  receiver.on('message', function (msg) {
    console.log('Received request: ', msg.toString());
    // simulate some work and send reply after 1s

    setTimeout(function () {
      receiver.send('World');
    }, 1000);

  });

}

process.on('SIGINT', function () {
  if (cluster.isMaster) {
    // stop accepting new requests
    clients.close();
    for (c in cluster.workers) {
      if ({}.hasOwnProperty.call(cluster.workers, c)) {
        cluster.workers[c].kill('SIGINT');
      }
    }
    cleanExit();
  } else {
    receiver.close();
  }
});
