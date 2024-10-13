const Express = require('express');
const BodyParser = require('body-parser')
const { execSync } = require('child_process');
const Crypto = require('crypto');
const FS = require('fs');
const Path = require('path');

console.log('teste')

const APP = Express();
APP.use(BodyParser.json());
APP.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

APP.post('/git', (req, res) => {
  let hmac = Crypto.createHmac("sha1", process.env.SECRET);
  let sig  = "sha1=" + hmac.update(JSON.stringify(req.body)).digest("hex");
  if (req.headers['x-github-event'] == "push" && sig == req.headers['x-hub-signature']) {
    execSync('chmod 777 ./git.sh'); 
    execSync('./git.sh');
    execSync('refresh');
  };
  
  return res.sendStatus(200);
});

const DeliveryContentFolder = FS.readdirSync('delivery_content');
let DeliveryContentSubfolders = [];

for (const Content of DeliveryContentFolder) {
  const FolderPath = Path.join('delivery_content', Content);
  const FolderFiles = FS.readdirSync(FolderPath);
  
  const FilePaths = FolderFiles.map((file) => Path.join(FolderPath, file));
  DeliveryContentSubfolders = DeliveryContentSubfolders.concat(FilePaths);
};

for (const ContentPath of DeliveryContentSubfolders) {
  const HttpPath = ContentPath.replace('delivery_content/', '');
  APP.get(`/${HttpPath}`, (req, res) => res.sendFile(Path.resolve(ContentPath)));
};

APP.get('/', (req, res) => { res.status(200).json({ status: 200 }); });
const ExpressServer = APP.listen(8080, () => console.log(`AxonCDN status sucessfully started.`));
