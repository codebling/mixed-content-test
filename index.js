const https = require('https');
const http = require('http');
const fs = require('fs');
const certs = require('live-server-https');
const express = require('express');
const cors = require('cors');
const debug = require('debug');

const app = express();

let cspCounter = 1;
const CSP_VIOLATION_REPORT_ENDPOINT = '/csp-violation-report-endpoint';
app.use( (req, res, next) => {
  res.set('Content-Security-Policy-Report-Only', `default-src https:; report-uri ${CSP_VIOLATION_REPORT_ENDPOINT}`);
  next();
});
app.post(CSP_VIOLATION_REPORT_ENDPOINT, (req, res) => {
  const reportFile = `/tmp/csp-report-${cspCounter++}.json`;
  req.pipe(fs.createWriteStream(reportFile));
  req.on('end', () => res.send('ok'));  
  fs.readFile(reportFile, (err, data) => debug('csp-report')(err || JSON.parse(data.toString())) );
});

app.use(cors());
app.use(express.static('dist'));
app.use(express.static('public'));

https.createServer(certs, app).listen(443, () => {
  console.log('https');
});

http.createServer(app).listen(80, ()  => {
  console.log('http');
});