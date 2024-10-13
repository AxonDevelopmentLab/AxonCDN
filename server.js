const Express = require('express');
const BodyParser = require('body-parser')
const { exec, execSync } = require('child_process');
const Crypto = require('crypto');

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
    setTimeout(() => {
      exec('./git.sh', (err, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (err) console.error(stderr);
      });

      execSync('refresh');
    }, 10000)
  };
  
  return res.sendStatus(200);
});

APP.get('/', (req, res) => { res.status(200).json({ status: 200 }); });
const ExpressServer = APP.listen(8080, () => console.log(`AxonCDN status sucessfully started.`));