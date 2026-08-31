const https = require('https');
const fs = require('fs');
const path = 'ngrok-v3.zip';
const file = fs.createWriteStream(path);
https.get('https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip', function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => console.log('Download complete'));
  });
}).on('error', function(err) {
  fs.unlink(path, () => {});
  console.error(err.message);
});
