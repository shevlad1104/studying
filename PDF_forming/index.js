//elements
const createPDFsBtn = document.querySelector('.establish__create-pdfs-btn');
const infoPara = document.querySelector('.info__para');
const downloadPDFs = document.querySelector('.info__download-pdfs-link');
const downloadTimer = document.querySelector('.info__download-timer-span');

//colors of result text
const colorSuccessCreatePDFs = '#009f00';
const colorErrorCreatePDFs = '#ff0000';

//variables for timer to download zip
let intervalIdDownloadZip;
let downloadZipStartTime;
const timeDownloadZip = 10000;

//variable for getting status of creating zip from server
let zipWithPDFsFinished = false;

//array for reuse websockets
let webSockets = [];

function responseOfCreatePDFsIsSuccess(responseObject) {

  let responseOfCreatePDFsIsSuccess = false;

  if ((responseObject !== null)
    && (typeof responseObject === 'object')
    && (responseObject.hasOwnProperty('result'))
    && (responseObject.result == globals.responsePDFsCreated)) {

    responseOfCreatePDFsIsSuccess = true;

  }

  return responseOfCreatePDFsIsSuccess;

}

function showResultCreatingPDFs() {

  //making para of result visible
  infoPara.style.display = 'block';

  if (zipWithPDFsFinished) {

    //set success values into para
    infoPara.innerHTML = 'PDFs created';
    infoPara.style.color = colorSuccessCreatePDFs;

  }

  else {

    //set errors values into para
    infoPara.innerHTML = 'Errors occured. Try it again';
    infoPara.style.color = colorErrorCreatePDFs;

  }

}

function setDefaultDisplay() {

  //disable btn of creating PDFs
  createPDFsBtn.disabled = true;

  //hide result text
  infoPara.style.display = 'none';

  //hide download link
  downloadPDFs.style.display = 'none';

  //hide timer
  downloadTimer.style.display = 'none';

}

function setResultDisplay() {

  //show result text (success or error)
  showResultCreatingPDFs();

  //show download link
  downloadPDFs.style.display = 'inline-block';

  //show timer to click
  downloadTimer.style.display = 'inline';

}

function changeDownloadTimer(timeLeft) {

  downloadTimer.innerHTML = '(will start in ' + timeLeft + ')';

}

function launchDownloadZip() {

  //get time past until launch auto click
  const currentTime = new Date();
  const timePast = currentTime - downloadZipStartTime;

  if ((timePast >= timeDownloadZip)
    && (zipWithPDFsFinished)) {

    //download timer is out and client recieved that zip finished on the server, so display success result and click automatically the download
    setResultDisplay();
    downloadPDFs.click();
  }

  else if ((timePast < timeDownloadZip)
    && (zipWithPDFsFinished)) {

    //client recieved that zip finished on the server, but download timer isn't out, then display success result and update how much time left to click automatically
    setResultDisplay();
    const timeLeft = '' + Math.ceil((timeDownloadZip - timePast) / 1000) + ' sec.';
    changeDownloadTimer(timeLeft);

  }

  else if ((timePast >= timeDownloadZip)
    && (!zipWithPDFsFinished)) {

    //client hasn't recieved that zip is finished and timer is out, we need to stop interval and display problem
    console.log('Client hasn\'t recieved that zip finished from server');
    clearInterval(intervalIdDownloadZip);
    finalizeCreatingPDFsWithErrors();

  }

}

function setDownloadTimerDisplay(displayValue) {

  downloadTimer.style.display = displayValue;

}

function getExistWebSocket() {

  let availableWebSocket = null;

  for (let i = 0; i < webSockets.length; i++) {

    if (webSockets[i].readyState === WebSocket.OPEN) {

      availableWebSocket = webSockets[i];
      break;

    }
  }

  return availableWebSocket;

}

function sendReadyToGetZipFinished(webSocket) {

  const webSocketMessage = { readyToGetZipFinished: true };
  webSocket.send(JSON.stringify(webSocketMessage));

}

function messageHasZipFinished(messageObject) {

  let messageHasZipFinished = false;

  if ((messageObject !== null)
    && (typeof messageObject === 'object')
    && (messageObject.hasOwnProperty('zipFinished'))) {

    messageHasZipFinished = true;

  }

  return messageHasZipFinished;

}

function sendStopTransmitZipFinished(webSocket) {

  const clientResponse = { stopSendZipFinished: true };
  webSocket.send(JSON.stringify(clientResponse));

}

function getWebSocket() {

  //trying to get existing webSocket
  let webSocket = getExistWebSocket();

  if (webSocket === null) {
    //creating if it doesn't exist
    webSocket = new WebSocket('wss://' + globals.domain + ':' + globals.port);
    webSockets.push(webSocket);

    webSocket.onopen = () => {
      //send to the server that client is ready to recieve message
      sendReadyToGetZipFinished(webSocket);
      console.log('ws client sent state=Ready');
    };

    webSocket.onmessage = (event) => {
      //get message object
      const messageObject = JSON.parse(event.data);

      if (messageHasZipFinished(messageObject)) {
        //handle if ZipFinished is true or false
        console.log('ws client got ZipFinished ' + messageObject.zipFinished);

        if (messageObject.zipFinished) {
          //get value into module var
          zipWithPDFsFinished = messageObject.zipFinished;

          //send that server should stop sending information about ZipFinished value
          sendStopTransmitZipFinished(webSocket);
          console.log('ws client sent stop');

        }
      }
    };

    webSocket.onclose = () => {
      console.log('ws client disconnected from server');
    };

  }

  return webSocket;

}

function activateWebSocketToCheckZip() {

  //set status of zip finished to default
  zipWithPDFsFinished = false;

  //get webSocket (new or existing)
  const webSocket = getWebSocket();

  if (webSocket.readyState === WebSocket.OPEN) {
    //send to the server that client is ready to recieve status of zip, if it's already open (otherwise it happens while onopen event of ws)
    sendReadyToGetZipFinished(webSocket);
  }

};

function setDownloadZIPLink(name, url) {

  downloadPDFs.setAttribute('download', name);
  downloadPDFs.href = url;

}

function activateDownloadZIPLink(url, name) {

  //set download link attributes
  setDownloadZIPLink(name, url);

  //send through ws message that client's ready to check zip's finished
  activateWebSocketToCheckZip();

  //start and display timer to click link automatically
  intervalIdDownloadZip = setInterval(launchDownloadZip, 100);
  downloadZipStartTime = new Date();

}

function finalizeCreatingPDFsWithErrors() {

  //show result text (success or error)
  showResultCreatingPDFs();

  //enable btn of creating PDFs
  createPDFsBtn.disabled = false;

}

function getDataFileToCreatePDFs() {

  const fileToCreatePDFs = document.querySelector('.establish__input-xls');

  return fileToCreatePDFs.files[0];

}

function getVisitGoalToCreatePDFs() {

  const visitGoal = document.querySelector('.establish__visit-goal');

  return visitGoal.value;

}

function getApplierInsuranse() {

  const applierInsuranse = document.querySelector('.establish__applier-insuranse');

  return applierInsuranse.value;

}

function getApplierPhone() {

  const applierPhone = document.querySelector('.establish__applier-phone');

  return applierPhone.value;

}

function getApplierCompany() {

  const applierCompany = document.querySelector('.establish__applier-company');

  return applierCompany.value;

}

function getApplierPosition() {

  const applierPosition = document.querySelector('.establish__applier-position');

  return applierPosition.value;

}

function getApplierFullName() {

  const applierFullName = document.querySelector('.establish__applier-name');

  return applierFullName.value;

}

function getDocsStr1() {

  const docsStr1 = document.querySelector('.establish__docs-str1');

  return docsStr1.value;

}

function getApplyDate() {

  const applyDate = document.querySelector('.establish__apply-date');

  return applyDate.value;

}

function getStartDate() {

  const startDate = document.querySelector('.establish__start-date');

  return startDate.value;

}

function getExpireDate() {

  const expireDate = document.querySelector('.establish__expire-date');

  return expireDate.value;

}

function getFormDataToCreatePDFs() {

  const formData = new FormData();

  //put the file
  const file = getDataFileToCreatePDFs();
  formData.append('fileXls', file, file.name);

  //put other values
  formData.append('visitGoal', getVisitGoalToCreatePDFs());
  formData.append('applierInsuranse', getApplierInsuranse());
  formData.append('applierPhone', getApplierPhone());
  formData.append('applierCompany', getApplierCompany());
  formData.append('applierPosition', getApplierPosition());
  formData.append('applierFullName', getApplierFullName());
  formData.append('applyDate', getApplyDate());
  formData.append('startDate', getStartDate());
  formData.append('expireDate', getExpireDate());
  formData.append('docsStr1', getDocsStr1());

  return formData;

}

function inputXlsIsUndefined() {

  const fileToCreatePDFs = document.querySelector('.establish__input-xls');

  let inputXlsIsUndefined = false;
  if (typeof fileToCreatePDFs.files[0] === 'undefined') {
    inputXlsIsUndefined = true;
  }

  return inputXlsIsUndefined;

}

function showProblemsToCreatePDFs(message) {

  //show paragraph of result visible
  infoPara.style.display = 'block';

  //set errors values into para
  infoPara.innerHTML = 'Errors caused by the reasons:<br>' + message;
  infoPara.style.color = colorErrorCreatePDFs;

}

function possibleToLaunchCreatePDFs() {

  //set defaults
  let possibleToLaunchCreatePDFs = true;
  let message = '';

  if (inputXlsIsUndefined()) {
    //check if file is defined or not
    message = message + (message === '' ? '' : '\n') + ' - Xls file isn\'t defined';
    possibleToLaunchCreatePDFs = false;
  }

  if (!possibleToLaunchCreatePDFs) {
    //display to user reasons of problems
    showProblemsToCreatePDFs(message)
  }

  return possibleToLaunchCreatePDFs;

}

createPDFsBtn.addEventListener('click', () => {
  console.log('666');
  //check inputs
  if (!possibleToLaunchCreatePDFs()) {
    return;
  }

  //set default - disable btn and hide result elements
  setDefaultDisplay();

  const request = new XMLHttpRequest();
  request.open('POST', 'https://' + globals.domain + '/createPDFs', true);

  request.onload = function (progressEvent) {

    //get the object of response from JSON
    const response = progressEvent.currentTarget.response;
    const responseObject = JSON.parse(response);

    if (responseOfCreatePDFsIsSuccess(responseObject)) {
      //activate download link
      const urlDownload = 'https://' + globals.domain + '/downloadPDFs?filename=' + responseObject.zipName;
      activateDownloadZIPLink(urlDownload, responseObject.zipName);
    }

    else {

      //finalize when errors occured (display problem and enable btn for the next time)
      console.log('Server responded that PDFs creating wasn\'t success');
      finalizeCreatingPDFsWithErrors();

    }
  };

  //send request with form data
  request.send(getFormDataToCreatePDFs());

});

downloadPDFs.addEventListener('click', () => {

  //switch off interval for launching download
  clearInterval(intervalIdDownloadZip);

  //enable btn of creating PDFs
  createPDFsBtn.disabled = false;

  //hide timer
  downloadTimer.style.display = 'none';

})