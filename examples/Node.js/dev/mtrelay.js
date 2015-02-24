/*
 * @fileoverview Multithreaded Hello World server. it uses
 *  cluster module since nodejs is singlethreaded
 * @author Octavian Ionescu <itavyg(at)gmail(dot)com>
 */
'use strict';
var c, cleanExit, k, sender, receiver,
  startedWorkers = 0,
  zmq = require('zmq'),
  cluster = require('cluster');

cleanExit = function () {
  if (0 === startedWorkers) {
    // no more workers
    receiver.close();
  }
};

if (cluster.isMaster) {
  receiver = zmq.socket('pair');
  receiver.bind('ipc://step3.ipc');
  receiver.on('message', function (/*msg*/) {
    console.log('Test successfull!');
  });

  cluster.on('fork', function (worker) {
    // send message to child to know which step to simulate
    // 1 it is in the middle
    // 2 it is at the end and must send message
    worker.send(++startedWorkers);
  });

  cluster.on('exit', function (/*worker, code, signal*/) {
    startedWorkers -= 1;
    cleanExit();
  });

  for (k = 0; 2 > k; k += 1) {
    cluster.fork();
  }
} else {
  process.on('message', function (processMsg) {
    if (1 === processMsg) {
      receiver = zmq.socket('pair');
      receiver.bind('ipc://step2.ipc');
      sender = zmq.socket('pair');
      sender.connect('ipc://step3.ipc');
      receiver.on('message', function (msg) {
        sender.send(msg);
      });
    } else {
      sender = zmq.socket('pair');
      sender.connect('ipc://step2.ipc');
      sender.send('');
    }
  });
}

process.on('SIGINT', function () {
  if (cluster.isMaster) {
    for (c in cluster.workers) {
      if ({}.hasOwnProperty.call(cluster.workers, c)) {
        cluster.workers[c].kill('SIGINT');
      }
    }
    cleanExit();
  } else {
    if (receiver) {
      receiver.close();
    }
    if (sender) {
      sender.close();
    }
  }
});
