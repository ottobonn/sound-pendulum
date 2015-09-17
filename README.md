# sound-pendulum
Node server and Arduino client for Bluetooth LE noise-making double pendulum.

The server software connects to the pendulum over Bluetooth LE to colect accelerometer data.
The server requires Node.js 0.12, and the client requires Arduino 1.6.0 or greater.

Note: node-gyp fails to build node-speaker on Node 4.0.0, so for right now
this project requires Node 0.12.

The Node server depends on `noble` to connect to Bluetooth LE devices. Before
installing `noble`, install its dependencies (for Linux):

    sudo apt-get install bluetooth bluez-utils libbluetooth-dev libudev-dev

Clone this repository, then run

    npm install

in the root directory to install the node modules. Running

    node sound

should start the sound-making server.
