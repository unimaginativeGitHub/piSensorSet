const sensor = require('node-dht-sensor');
const express = require('express');
const https = require("https");
const app = express();

const sendFrequency = 60000; // 60 seconds
const apiKey = 'FXLL8IM3ZJ1244OC';
const sensorDHTModel = 11;
const sensorGPIO = 4;

const generateGETLink = (temp, hum) => {
  console.log(`https://api.thingspeak.com/update?api_key=${apiKey}&field1=${temp}&field2=${hum}`);
  return `https://api.thingspeak.com/update?api_key=${apiKey}&field1=${temp}&field2=${hum}`;
}

async function sendDataToService() {
  console.log('retrieving sensor data...');
  const sensorData = await sensor.read(sensorDHTModel, sensorGPIO);
  if (sensorData.isValid) {
    const url = generateGETLink(sensorData.temperature.toFixed(1), sensorData.humidity.toFixed(1));
    https.get(url, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        body = JSON.parse(body);
        console.log('message sent');
      });
    });
  } else {
    console.log('The was a problem sending temp and or humidity values. There were ' + sensorData.errors + ' errors');
  }
}

app.get('/all', async function(req, res) {
  console.log('get all');
  try {
    const sensorData = await sensor.read(sensorDHTModel, sensorGPIO);
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Temp + Humidity Readings</title>
      </head>
      <body>
        <pre>
Temperature:  ${sensorData.temperature.toFixed(1)} °C <br/>
Humidity:     ${sensorData.humidity.toFixed(1)} %
        </pre>
      </body>
    </html>
    `);
  } catch(err) {
    res.send('There was a problem retrieving temp and or humidity values. Error: ' + err);
  }
});

app.get('/temperature', async function(req, res) {
  try {
    const sensorData = await sensor.read(sensorDHTModel, sensorGPIO);
    res.send(sensorData.temperature.toFixed(1));
  } catch(err) {
    res.send('There was a problem retrieving temp values. Error: ' + err);
  }
});

app.get('/humidity', async function(req, res) {
  try {
    const sensorData = await sensor.read(sensorDHTModel, sensorGPIO);
    res.send(sensorData.humidity.toFixed(1));
  } catch(err) {
    res.send('There was a problem retrieving humidity values. Error: ' + err);
  }
});

setInterval(sendDataToService, sendFrequency);

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
