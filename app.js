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

const getSensorData = (callback) => {
  console.log('retrieving sensor data...');
  sensor.read(sensorDHTModel, sensorGPIO, (err, temperature, humidity) => {
    if (err) {
      console.log('Err!!! -> ', err);
      callback(err, null);
    } else {
      console.log('Temperature: ' + temperature + ' °C');
      console.log('Humidity:    ' + humidity + ' %');
      callback(null, {
        temperature: temperature.toFixed(1),
        humidity: humidity.toFixed(1)
      });
    }
  });
}

async function getSensorDataTWO() {
  console.log('retrieving sensor data...');
  let sensorData = await sensor.read(sensorDHTModel, sensorGPIO);
  if (sensorData.isValid) {
    const url = generateGETLink(sensorData.temperature, sensorData.humidity);
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

const sendDataToService = () => {
  console.log('send data...');
  getSensorData((err, data) => {
    if (err) {
      console.log('The was a problem sending temp and or humidity values.\n\n' + err);
    } else {
      const url = generateGETLink(
        data.temperature,
        data.humidity
      );
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
    }
  });
}

app.get('/all', (req, res) => {
  console.log('get all');
  getSensorData((err, data) => {
    if (err) {
      res.send('The was a problem retrieving temp and or humidity values.\n\n' + err);
    } else {
      console.log('Temperature: ' + data.temperature + ' °C');
      console.log('Humidity:    ' + data.humidity + ' %');
      // <meta http-equiv="refresh" content="10">
      res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Temp + Humidity Readings</title>
        </head>
        <body>
          <pre>
  Temperature:  ${data.temperature} °C <br/>
  Humidity:     ${data.humidity} %
          </pre>
        </body>
      </html>
      `);
    }
  });
});

app.get('/temperature', (req, res) => {
  console.log('get temp');
  getSensorData((err, data) => {
    if (err) {
      res.send('The was a problem retrieving temperature values.<br/><br/>Error:' + err);
    } else {
      console.log('Temperature: ' + data.temperature + ' °C');
      res.send(data.temperature);
    }
  });
});

app.get('/humidity', (req, res) => {
  getSensorData((err, data) => {
    if (err) {
      res.send('The was a problem retrieving humidity values.<br/><br/>Error:' + err);
    } else {
      console.log('Humidity:    ' + data.humidity + ' %');
      res.send(data.humidity);
    }
  });
});

setInterval(sendDataToService, sendFrequency);

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
