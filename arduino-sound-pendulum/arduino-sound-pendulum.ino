#include <Wire.h>
#include <Arduino.h>
#include <SPI.h>

#include <Adafruit_MMA8451.h>
#include <Adafruit_Sensor.h>
#if not defined (_VARIANT_ARDUINO_DUE_X_) && not defined (_VARIANT_ARDUINO_ZERO_)
  #include <SoftwareSerial.h>
#endif

#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BluefruitLE_UART.h"

#include "bluefruit_config.h"

/*=========================================================================
    APPLICATION SETTINGS

    FACTORYRESET_ENABLE       Perform a factory reset when running this sketch
   
                              Enabling this will put your Bluefruit LE module
                              in a 'known good' state and clear any config
                              data set in previous sketches or projects, so
                              running this at least once is a good idea.
   
                              When deploying your project, however, you will
                              want to disable factory reset by setting this
                              value to 0.  If you are making changes to your
                              Bluefruit LE device via AT commands, and those
                              changes aren't persisting across resets, this
                              is the reason why.  Factory reset will erase
                              the non-volatile memory where config data is
                              stored, setting it back to factory default
                              values.
       
                              Some sketches that require you to bond to a
                              central device (HID mouse, keyboard, etc.)
                              won't work at all with this feature enabled
                              since the factory reset will clear all of the
                              bonding data stored on the chip, meaning the
                              central device won't be able to reconnect.
    MINIMUM_FIRMWARE_VERSION  Minimum firmware version to have some new features
    MODE_LED_BEHAVIOUR        LED activity, valid options are
                              "DISABLE" or "MODE" or "BLEUART" or
                              "HWUART"  or "SPI"  or "MANUAL"
    -----------------------------------------------------------------------*/
    #define FACTORYRESET_ENABLE         0
    #define MINIMUM_FIRMWARE_VERSION    "0.6.6"
    #define MODE_LED_BEHAVIOUR          "MODE"
/*=========================================================================*/

// define USB_SERIAL to print accelerometer readings over USB.
//#define USB_SERIAL

Adafruit_BluefruitLE_SPI ble(BLUEFRUIT_SPI_CS, BLUEFRUIT_SPI_IRQ, BLUEFRUIT_SPI_RST);

Adafruit_MMA8451 mma = Adafruit_MMA8451();

// A small helper
void error(const __FlashStringHelper*err) {
  Serial.println(err);
  while (1);
}

void initialize_bluetooth(){
  /* Initialise the module */
  Serial.print(F("Initialising the Bluefruit LE module: "));

  if ( !ble.begin(VERBOSE_MODE) )
  {
    error(F("Couldn't find Bluefruit; make sure it's in command mode & check wiring."));
  }
  Serial.println( F("OK") );

  if ( FACTORYRESET_ENABLE )
  {
    /* Perform a factory reset to make sure everything is in a known state */
    Serial.println(F("Performing a factory reset."));
    if ( ! ble.factoryReset() ){
      error(F("Couldn't reset."));
    }
  }

  /* Disable command echo from Bluefruit */
  ble.echo(false);

  Serial.println("Requesting Bluefruit info:");
  /* Print Bluefruit information */
  ble.info();

  ble.verbose(false);  // debug info is a little annoying after this point!

  /* Wait for connection */
  while (! ble.isConnected())
    delay(500);

  // LED Activity command is only supported from 0.6.6
  if ( ble.isVersionAtLeast(MINIMUM_FIRMWARE_VERSION) )
  {
    // Change Mode LED Activity
    Serial.println(F("Change LED activity to " MODE_LED_BEHAVIOUR));
    ble.sendCommandCheckOK("AT+HWModeLED=" MODE_LED_BEHAVIOUR);
  }
}

void setup(void) {
  Serial.begin(115200);
  
  initialize_bluetooth();

  if (! mma.begin()) {
    Serial.println("Couldn't start accelerometer. Setup stopped.");
    while (1);
  }
  Serial.println("MMA8451 accelerometer connected.");
  
  mma.setRange(MMA8451_RANGE_8_G);
  
  Serial.print("Range set to "); Serial.print(2 << mma.getRange());  
  Serial.println("g");
  
}

void loop() {
  /* Get a new sensor event */ 
  sensors_event_t event; 
  mma.getEvent(&event);

  #ifdef USB_SERIAL
  /* Display the results (acceleration is measured in m/s^2) */
  Serial.print("X: \t"); Serial.print(event.acceleration.x); Serial.print("\t");
  Serial.print("Y: \t"); Serial.print(event.acceleration.y); Serial.print("\t");
  Serial.print("Z: \t"); Serial.print(event.acceleration.z); Serial.print("\t");
  Serial.println("m/s^2 ");
  #endif

  // Find the total magnitude of acceleration in X and Y
  float total = sqrt(pow(event.acceleration.x, 2) + pow(event.acceleration.y, 2));
  
  // Send results over bluetooth.
  ble.print("AT+BLEUARTTX=");
  ble.println(total);

  // check response status
  unsigned long previousTime = millis();
  int timeout = 100; //ms
  while (!ble.waitForOK()){
    if ((unsigned long)(millis() - previousTime) >= timeout) {
      ble.end();
      initialize_bluetooth();
      break;
    }
  }

  delay(500);
}

uint8_t convertToByte(float acceleration, int scale){
  return uint8_t (acceleration / scale);
}
