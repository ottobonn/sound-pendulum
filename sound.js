"use strict";

var Pico = require("node-pico");


function sinetone() {
  var x1 = 0, y1 = 440 / Pico.sampleRate;
  var x2 = 0, y2 = 442 / Pico.sampleRate;

  return function soundCallback(e) {
    var out = e.buffers;

    for (var i = 0; i < e.bufferSize; i++) {
      out[0][i] = Math.sin(2 * Math.PI * x1) * 0.25;
      out[1][i] = Math.sin(2 * Math.PI * x2) * 0.25;
      x1 += y1;
      x2 += y2;
    }
  };

}

Pico.play(sinetone());

setTimeout(function() {
  Pico.pause();
}, 5000);
