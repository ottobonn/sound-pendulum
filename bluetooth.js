var noble = require('noble');

/*
  The UUID of the specific Bluefruit LE Micro on the pendulum.
  TODO move this to the config file.
*/
var pendulumBluefruitUUID = '0';

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
var bluefruitDataServiceUUID = '6E400001-B5A3-F393-­E0A9-­E50E24DCCA9E';

/*
  The trasmit (peripheral to central) characteristic of the data service.
*/
var bluefruitDataServiceTxUUID = '0x002';

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning([bluefruitDataServiceUUID], false, handleError);
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
  console.log(peripheral);
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
        services.forEach(function(service) {
          service.discoverCharacteristics([bluefruitDataServiceTxUUID], function(err, characteristics) {
            console.log('  ' + service.uuid);
            if (err) throw err;
            characteristics.forEach(function(characteristic) {
              setInterval(function() {
                characteristic.read(function(err, data) {
                  if (err) throw err;
                  console.log('Data from serial: ' + data.toByteArray());
                });
              }, 1000);
              console.log('    ' + characteristic.uuid + ' (Bluefruit Serial)');
              console.log('Subscribing to Bluefruit serial characteristic...');
              characteristic.notify(true, function(err) {
                if (err) throw err;
                console.log('Successfully subscribed to Bluefruit serial notifications.');
              });
            });
          });
        });
      });
    });
  }
});

function handleError(e){
  console.log(e);
}

var triedToExit = false;

function exitHandler(options, err) {
  if (connectedBean && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting from Bean...');
    connectedBean.disconnect(function(err) {
      console.log('Disconnected.');
      process.exit();
    });
  } else {
    process.exit();
  }
}

process.on('SIGINT', exitHandler.bind(null, {exit:true}));
