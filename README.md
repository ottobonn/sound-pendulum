# sound-pendulum
Node server and Arduino client for Bluetooth LE noise-making double pendulum.

The server software connects to the pendulum over Bluetooth LE to colect accelerometer data. 
The server requires Node.js, and the client requires Arduino 1.6.0 or greater.

Clone this repository, then run
    
    npm install

in the root directory to install the node modules. Running

    node sound
    
should start the sound-making server.
