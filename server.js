const express = require('express');
const bodyParser = require('body-parser')
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const app = express();

let cache = {
  uptime: 1,
  total: 0,
  hour: 0
};

app.use(bodyParser.json(), (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  next();
});

const DeliveryContentFolder = fs.readdirSync('delivery_content');
let DeliveryContentSubfolders = [];

for (const Content of DeliveryContentFolder) {
  const FolderPath = path.join('delivery_content', Content);
  const FolderFiles = fs.readdirSync(FolderPath);
  
  const FilePaths = FolderFiles.map((file) => path.join(FolderPath, file));
  DeliveryContentSubfolders = DeliveryContentSubfolders.concat(FilePaths);
};

for (const ContentPath of DeliveryContentSubfolders) {
  const HttpPath = ContentPath.replace('delivery_content/', '');
  app.get(`/${HttpPath}`, (req, res) => { cache.total++; cache.hour++; res.sendFile(path.resolve(ContentPath)) });
};

app.get('/', (req, res) => {
  cache.total++;
  cache.hour++;
  res.send({ status: 200, requests: {
    total: cache.total,
    last_hour: cache.hour,
    statistics: {
      average_per_hour: Number(cache.total / cache.uptime).toFixed(2),
      ratelimit: `${cache.hour}/4000`
    }
  }})
});

app.post('/git', (req, res) => {
  let hmac = crypto.createHmac("sha1", process.env.SECRET);
  let sig  = "sha1=" + hmac.update(JSON.stringify(req.body)).digest("hex");
  if (req.headers['x-github-event'] == "push" && sig == req.headers['x-hub-signature']) {
    execSync('chmod 777 ./git.sh'); 
    execSync('./git.sh');
    execSync('refresh');
  };
  
  return res.sendStatus(200);
});

const expressServer = app.listen(8080, () => console.log(`AxonCDN status sucessfully started.`));
setInterval(() => { cache.uptime++; cache.hour = 0; }, 1000 * 60 * 60);