//common modules
const fsPromises = require('fs').promises;
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const formidable = require('formidable');
const WebSocket = require('ws');

//get root dir
const path = require('path');
const rootDir = __dirname;

//module for handling PDFs
const handlePdfs = require(path.join(rootDir, '/modules/handle-pdfs.js'));

//global module for providing global vars
const globals = require(path.join(rootDir, '/modules/globals.js'));

//var for interval checking that zip is finished
let idIntervalZipFinished;

const localPathKeySSL = './ssl/key.pem';
const localPathCertSSL = './ssl/cert.pem';

const serverPathKeySSL = '/etc/letsencrypt/live/pass26.ru/privkey.pem';
const serverPathCertSSL = '/etc/letsencrypt/live/pass26.ru/cert.pem';

function setResponse(contentType, content, code, response) {

  response.setHeader("Content-Type", contentType);
  response.writeHead(code);
  response.write(content);
  response.end();

}

function loadFile(pathName, contentType, response) {

  fsPromises.readFile(pathName)
    .then(content => {
      //send response loading file
      setResponse(contentType, content, 200, response);
    })
    .catch(err => {
      //send error
      console.log('Could not read file');
      setResponse('text/plain', '', 404, response);
    });

}

function loadFiles(request, response) {

  let pathname = url.parse(request.url).pathname;

  if (pathname == '/') {

    loadFile(__dirname + '/index.html', 'text/html', response);

  } else if (pathname == '/index.js') {

    loadFile(__dirname + '/index.js', 'application/javascript', response);

  } else if (pathname == '/dist/bundle.js') {

    loadFile(__dirname + '/dist/bundle.js', 'application/javascript', response);

  } else if (pathname == '/css/normilize.css') {

    loadFile(__dirname + '/css/normilize.css', 'text/css', response);

  } else if (pathname == '/css/style.css') {

    loadFile(__dirname + '/css/style.css', 'text/css', response);

  } else {

    response.end();
  }

};

function getResponseOfSuccessCreatingPDFs() {

  const ResponseOfSuccessCreatingPDFs = {
    result: globals.responsePDFsCreated,
    zipPath: handlePdfs.getZipPath(),
    zipName: handlePdfs.getZipName()
  };

  return ResponseOfSuccessCreatingPDFs;

}

function getResponseOfFailedCreatingPDFs() {

  const ResponseOfFailedCreatingPDFs = {
    result: globals.responsePDFsNotCreated
  };

  return ResponseOfFailedCreatingPDFs;

}

function launchCreatingPDFs(formFields, formFiles, response) {

  //try to create PDFs and launch to create a zip
  handlePdfs.setZipParamsToDefault();
  handlePdfs.createPdfs(formFields, formFiles);

  if (handlePdfs.getZipCreatingLaunched()) {
    //success in creating PDFs
    console.log('ZIP with PDFs created');
    setResponse('text/html', JSON.stringify(getResponseOfSuccessCreatingPDFs()), 200, response);
  }

  else {
    //fail in creating PDFs
    console.log('Could not create PDFs or ZIP');
    setResponse('text/html', JSON.stringify(getResponseOfFailedCreatingPDFs()), 500, response);
  }

}

function sendDownloadPDFsResponse(request, response) {

  //get file path and name
  const urlObject = url.parse(request.url, true);
  const fileName = urlObject.query.filename;
  const filePath = path.join(rootDir, globals.downloadsDir, fileName);

  fs.readFile(filePath, function (error, data) {

    if (error === null) {
      //send zip to the client
      response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
      setResponse('application/zip', data, 200, response);

    } else {
      //send error
      console.log('Could not send ZIP with PDFs for downloading');
      setResponse('text/plain', error, 500, response);
    }
  });

}

const requestListener = function (request, response) {

  if (request.method === 'GET') {

    if (request.url.startsWith('/downloadPDFs')) {
      //send response if it's request to download PDFs
      sendDownloadPDFsResponse(request, response);
    }
    else {
      //loading files to open in browser
      loadFiles(request, response);
    }

  }

  else if ((request.method === 'POST')
    && (request.url === '/createPDFs')) {

    const form = formidable({ multiples: false });

    form.parse(request, (error, formFields, formFiles) => {
      if (error == null) {
        //no errors parsing data form
        try {

          //try to create PDFs
          launchCreatingPDFs(formFields, formFiles, response);

        } catch (error) {

          //response fail if any unexpected error
          console.log('Could not create PDFs or ZIP: ' + error);
          setResponse('text/html', JSON.stringify(getResponseOfFailedCreatingPDFs()), 500, response);

        }

      }

      else {
        //response fail if any unexpected error
        console.log('Could not get XLS for proccessing: ' + error);
        setResponse('text/html', JSON.stringify(getResponseOfFailedCreatingPDFs()), 500, response);
      }

    });

    request.on('error', (error) => {
      console.error(error);
    });

  }

};

function isMessage_StopSendZipFinished(messageObject) {

  let StopSendZipFinished = false;

  if ((messageObject !== null)
    && (typeof messageObject === 'object')
    && (messageObject.hasOwnProperty('stopSendZipFinished'))
    && (messageObject.stopSendZipFinished)) {

    StopSendZipFinished = true;

  }

  return StopSendZipFinished;

}

function isMessage_readyToGetZipFinished(messageObject) {

  let readyToGetZipFinished = false;

  if ((messageObject !== null)
    && (typeof messageObject === 'object')
    && (messageObject.hasOwnProperty('readyToGetZipFinished'))
    && (messageObject.readyToGetZipFinished)) {

    readyToGetZipFinished = true;

  }

  return readyToGetZipFinished;

}

function getStrWebSocketMessage(messageObject) {

  let strMessage = '';

  if (isMessage_StopSendZipFinished(messageObject)) {

    //this is a message about necessity to stop sending value of ZipFinished
    strMessage = 'stopSendZipFinished';

  }

  else if (isMessage_readyToGetZipFinished(messageObject)) {

    //this is a message about readyness to get value of ZipFinished by client
    strMessage = 'readyToGetZipFinished';

  }

  return strMessage;

};

function launchSendingZipFinished(webSocket) {

  idIntervalZipFinished = setInterval(() => {

    //send value of ZipFinished until client gets true value
    const zipFinished = handlePdfs.getZipFinished();
    const sentData = {
      zipFinished: zipFinished
    };

    webSocket.send(JSON.stringify(sentData));
    console.log('server webSocket sent zipFinished ' + zipFinished);

  }, 300);

}

function initWebSocket(webSocket) {

  webSocket.on('message', (message) => {

    //get str of message from client
    const strMessage = getStrWebSocketMessage(JSON.parse(message));

    if (strMessage === 'readyToGetZipFinished') {

      //client informed about its readyness to recieve value of ZipFinished, so we need to launch interval sending zipFinished value from server
      launchSendingZipFinished(webSocket);

    }
    else if (strMessage === 'stopSendZipFinished') {

      //client commanded to stop sending value of ZipFinished because it already got it with true value
      clearInterval(idIntervalZipFinished);
      console.log('interval for sending from ws server has been cleared');

    }
  });

  webSocket.on('close', (error) => {
    //webSocket closed
    console.log('server webSocket closed');
  });
};

let pathKeySSL = '';
let pathCertSSL = '';

if (globals.domain === 'localhost') {
  pathKeySSL = localPathKeySSL;
  pathCertSSL = localPathCertSSL;
}
else {
  pathKeySSL = serverPathKeySSL;
  pathCertSSL = serverPathCertSSL;
};

//create https server
const optionsHTTPS = {
  'key': fs.readFileSync(pathKeySSL),
  'cert': fs.readFileSync(pathCertSSL)
};

const httpsServer = https.createServer(optionsHTTPS, requestListener);
httpsServer.listen(globals.port, globals.domain);

//create WebSocket server
const webSocketServer = new WebSocket.Server({ server: httpsServer });
webSocketServer.on('connection', initWebSocket);

//create http server for redirect to https
// const httpServer = http.createServer((request, response) => {
//   response.writeHead(301, { 'Location': `https://${request.headers.host}${request.url}` });
//   response.end();
// });
// httpServer.listen(80);