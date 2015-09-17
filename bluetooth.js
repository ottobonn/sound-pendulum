var noble = require('noble');
var util = require('util');

/*
  The UUID of the specific Bluefruit LE Micro on the pendulum.
  TODO move this to the config file.
*/
var pendulumBluefruitUUID = 'f1ce13bbdaa7';

/*
  The noble peripheral object for the connected pendulum.
*/
var connectedPendulum = {};

/*
  The UUID of the UART generic data pipe service provided by the Adafruit
  Bluefruit LE Micro. See
  https://learn.adafruit.com/introducing-the-adafruit-bluefruit-le-uart-friend/uart-service
  for more info.
*/
var bluefruitDataServiceUUID = '6e400001b5a3f393e0a9e50e24dcca9e';

/*
  The trasmit (peripheral to central) characteristic of the data service.
*/
var bluefruitDataServiceTxUUID = '6e400003b5a3f393e0a9e50e24dcca9e';

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning([bluefruitDataServiceUUID]);
    console.log('Scanning for BLE devices with service UUID ' + bluefruitDataServiceUUID);
  } else {
    noble.stopScanning();
    console.log('State changed to ' + '. Scanning stopped.');
  }
});

/*
  Connect to the pendulum when we discover it.
  Thanks to https://github.com/mplewis/noble-bean/blob/master/main.js for
  the bulk of this function and other connectivity functions.
*/
noble.on('discover', function peripheralDiscovered(peripheral){
  console.log('Peripheral discovered: ');
  var name = peripheral.advertisement.localName;
  var uuid = peripheral.uuid;
  console.log(util.format('(%s @ %s)', name, uuid));
  if (uuid === pendulumBluefruitUUID) {
    noble.stopScanning();
    console.log('Connecting to ' + name + '...');
    peripheral.connect(function(err) {
      if (err) throw err;
      console.log('Connected!');
      connectedPendulum = peripheral;
      peripheral.discoverServices([bluefruitDataServiceUUID], function(err, services) {
        if (err) throw err;
        var dataService = services[0];
        dataService.discoverCharacteristics([bluefruitDataServiceTxUUID], function(err, characteristics) {
          if (err) throw err;
          txCharacteristic = characteristics[0];
          console.log('Discovered transmit characteristic: ' + txCharacteristic);
          txCharacteristic.on('data', dataListener);
          txCharacteristic.notify(true, function(err) {
            if (err) throw err;
            console.log('Successfully subscribed to Bluefruit serial notifications.');
          });
        });
      });
    });
  }
});

function dataListener(data, isNotification){
  console.log((isNotification ? 'N:' : ' ') + data);
}

function handleError(e){
  console.log('Error: ');
  console.log(e);
}

var triedToExit = false;

function exitHandler(options, err) {
  if (connectedPendulum && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting from pendulum...');
    connectedPendulum.disconnect(function(err) {
      console.log('Disconnected.');
      process.exit();
    });
  } else {
    process.exit();
  }
}

process.on('SIGINT', exitHandler.bind(null, {exit:true}));
