//common libs
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

//set root dir
const rootDir = path.join(__dirname, '../');

//lib to handle PDFs
const pdfFormJS = require(path.join(rootDir, '/modules/lib/pdfform.js'));

//lib to handle
const xlsx = require('xlsx');

//consts for paths
const pathEmptyApplication = path.join(rootDir, '/templates/input.pdf', );
const outputFilesDir = path.join(rootDir, '/output_files/');

//using global vars through global module
const globals = require(path.join(rootDir, '/modules/globals.js'));

//vars for creating zip with PDFs
let zipCreatingLaunched;
let zipPath;
let zipName;
let zipFinished;

function removeFilesFromDir(dir) {

  const contentDir = fs.readdirSync(dir);

  for (let indexOfFile = 0; indexOfFile < contentDir.length; indexOfFile++) {
    const filePath = contentDir[indexOfFile];
    fs.rmSync(dir + filePath);
  }

}

function getCurrentDateString() {

  //get current date
  const currentDate = new Date();

  //get parts of the date in strings of proper sizes
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentDay = currentDate.getDate().toString().padStart(2, '0');
  const currentHour = currentDate.getHours().toString().padStart(2, '0');
  const currentMinute = currentDate.getMinutes().toString().padStart(2, '0');
  const currentSecond = currentDate.getSeconds().toString().padStart(2, '0');

  //conc parts into a string
  const CurrentDateString = currentDay + currentMonth + currentYear + currentHour + currentMinute + currentSecond;

  return CurrentDateString;

}

function zipPDFs(outputFilesDir, zipParams) {

  //create a zip file
  zipParams.zipName = 'PDFs_' + getCurrentDateString() + '.zip';
  zipParams.zipPath = path.join(rootDir, globals.downloadsDir, zipParams.zipName);
  const outputZIP = fs.createWriteStream(zipParams.zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  outputZIP.on('close', function () {
    //success in creating zip
    zipFinished = true;
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });

  outputZIP.on('end', function () {
    //output stream has ended abnormally
    console.log('Output stream has ended');
  });

  archive.on('warning', function (error) {
    //warning occured (not fatal error) while creating zip
    console.log('Warning occured while creating ZIP: ' + error);
  });

  archive.on('error', function (error) {
    //problem occured while creating zip
    console.log('Error occured while creating ZIP: ' + error);
  });

  //append files of dir and finalize the zip
  archive.pipe(outputZIP);
  archive.directory(outputFilesDir, false);
  archive.finalize();

}

function setZipParams(paramZipCreatingLaunched, paramZipFinished, paramZipPath, paramZipName) {

  zipCreatingLaunched = paramZipCreatingLaunched;
  zipFinished = paramZipFinished;
  zipPath = paramZipPath;
  zipName = paramZipName;

}

function setZipParamsToDefault() {

  setZipParams(false, false, '', '')

}

function getZipCreatingLaunched() {

  return zipCreatingLaunched;

}

function getZipPath() {

  return zipPath;

}

function getZipName() {

  return zipName;

}

function getZipFinished() {

  return zipFinished;

}

function getDateFromXls(valueXls) {

  const dateObject = xlsx.SSF.parse_date_code(valueXls);
  const dataStr = dateObject.d.toString().padStart(2, '0') + '.' + dateObject.m.toString().padStart(2, '0') + '.' + dateObject.y.toString();

  return dataStr;

}

function addWordToString(word, str) {

  const strWithWord = str + (str === '' ? '' : ' ') + word;

  return strWithWord;

}

function splitStrWithoutBreakWords(str, maxPartsCount, obj) {

  //split str into array of words
  const arrayWords = str.split(' ');

  //init loop vars: partNum means num of the current part (piece) of splitting, wordIndex means the current word from array
  let partNum = 1;
  let wordIndex = 0;

  while ((wordIndex < arrayWords.length)
    && (partNum <= maxPartsCount)) {

    //get current word
    const word = arrayWords[wordIndex].trim();

    if (addWordToString(word, obj['part' + partNum]).length <= obj['lengthPart' + partNum]) {
      //add the word to the current part if its length limit allows that
      obj['part' + partNum] = addWordToString(word, obj['part' + partNum]);
    }
    else {
      //increase num of the current part withiout increasing index, because we need to try putting current word into the next part
      partNum++;
      continue;
    };

    //increase index
    wordIndex++;
  };

}

function getSignFromName(nameObject) {

  const sign = nameObject.firstName.slice(0, 1) + '.' + nameObject.fatherName.slice(0, 1) + '. ' + nameObject.secondName;

  return sign;

}

function getPartsOfName(str) {

  const partsOfName = str.split(' ');

  const nameObject = {
    firstName: partsOfName[1].trim(),
    secondName: partsOfName[0].trim(),
    fatherName: partsOfName[2].trim()
  };

  return nameObject;

}

function getDateLetters(dateStr) {

  //get string parts of date
  const dateValue = new Date(dateStr);
  const currentYear = dateValue.getFullYear().toString();
  const currentMonth = (dateValue.getMonth() + 1).toString().padStart(2, '0');
  const currentDay = dateValue.getDate().toString().padStart(2, '0');

  //slice date parts into letters
  const dateLetters = {
    'letter1': currentDay.slice(0, 1),
    'letter2': currentDay.slice(1, 2),
    'letter3': currentMonth.slice(0, 1),
    'letter4': currentMonth.slice(1, 2),
    'letter5': currentYear.slice(0, 1),
    'letter6': currentYear.slice(1, 2),
    'letter7': currentYear.slice(2, 3),
    'letter8': currentYear.slice(3, 4),
  };

  return dateLetters;

}

function appendDateLettersToArray(dateStr, dateAssign, PDFfields) {

  if (!isNaN(Date.parse(dateStr))) {

    //get letters of the date
    const dateLetters = getDateLetters(dateStr);

    //append to the array date's letters
    PDFfields[dateAssign + '1'] = dateLetters.letter1;
    PDFfields[dateAssign + '2'] = dateLetters.letter2;
    PDFfields[dateAssign + '3'] = dateLetters.letter3;
    PDFfields[dateAssign + '4'] = dateLetters.letter4;
    PDFfields[dateAssign + '5'] = dateLetters.letter5;
    PDFfields[dateAssign + '6'] = dateLetters.letter6;
    PDFfields[dateAssign + '7'] = dateLetters.letter7;
    PDFfields[dateAssign + '8'] = dateLetters.letter8;

  }

}

function getPDFFileds(row, commonData) {

  //get parts of full name
  visitorNameObject = getPartsOfName(row[1].toString().trim());
  const visitorFirstName = visitorNameObject.firstName.toUpperCase().replaceAll('Й', 'й');
  const visitorSecondName = visitorNameObject.secondName.toUpperCase().replaceAll('Й', 'й');
  const visitorFatherName = visitorNameObject.fatherName.toUpperCase().replaceAll('Й', 'й');

  //get visitor bd
  const visitorBirthday = getDateFromXls(row[2]);

  //get parts of birth location (pdf form demands to split it into several strs), and split it with whole words
  const visitorBirthLoc = row[3].toString().trim().toUpperCase();
  const visitorBirthLocObject = {
    part1: '',
    part2: '',
    lengthPart1: 34,
    lengthPart2: 60
  };
  splitStrWithoutBreakWords(visitorBirthLoc, 2, visitorBirthLocObject);

  //get parts of address (pdf form demands to split it into several strs), and split it with whole words
  const visitorAddress = row[4].toString().trim().toUpperCase();
  const visitorAddressObject = {
    part1: '',
    part2: '',
    part3: '',
    lengthPart1: 20,
    lengthPart2: 34,
    lengthPart3: 33
  };
  splitStrWithoutBreakWords(visitorAddress, 3, visitorAddressObject);

  //get parts of visitor company (pdf form demands to split it into several strs), and split it with whole words
  const visitorCompany = row[5].toString().trim().toUpperCase();
  const visitorCompanyObject = {
    part1: '',
    part2: '',
    lengthPart1: 35,
    lengthPart2: 60,
  };
  splitStrWithoutBreakWords(visitorCompany, 2, visitorCompanyObject);

  //get parts of visit goal (pdf form demands to split it into several strs), and split it with whole words
  const visitGoal = commonData.visitGoal.toUpperCase();
  const visitGoalObject = {
    part1: '',
    part2: '',
    lengthPart1: 40,
    lengthPart2: 60,
  };
  splitStrWithoutBreakWords(visitGoal, 2, visitGoalObject);

  //get visitor position
  const visitorPosition = row[6].toString().trim().toUpperCase();

  //get visitor's phone
  const phone = row[8].toString().trim();

  //get visitor's email
  const email = row[9].toString().trim().toUpperCase();

  //get visitor's passport series and nums with adding absent zeros
  let passportSeriNum = row[11].toString().trim();
  while (passportSeriNum.length < 10) {
    passportSeriNum = '0' + passportSeriNum;
  };

  const passportSeri = passportSeriNum.slice(0, 4);
  const passportNum = passportSeriNum.slice(4);

  //get visitor's passport date and unit
  const passportDate = getDateFromXls(row[13]);
  const passportUnitId = row[14].toString().trim();

  //get parts of applier's full name
  applierNameObject = getPartsOfName(commonData.applierFullName.trim());
  const applierFirstName = applierNameObject.firstName.toUpperCase().replaceAll('Й', 'й');
  const applierSecondName = applierNameObject.secondName.toUpperCase().replaceAll('Й', 'й');
  const applierFatherName = applierNameObject.fatherName.toUpperCase().replaceAll('Й', 'й');
  const applierSign = getSignFromName(applierNameObject);

  //get other applier's data (insuranse, phone, company. position)
  const applierInsuranse = commonData.applierInsuranse;
  const applierPhone = commonData.applierPhone;
  const applierCompany = commonData.applierCompany.toUpperCase();
  const applierPosition = commonData.applierPosition.toUpperCase();

  //get dates' letters
  const startDateLetters = getDateLetters(commonData.startDate);
  const expireDateLetters = getDateLetters(commonData.expireDate);

  //put all processed values into array to fill pdf
  const PDFfields = {
    'visitorSecondName': [visitorSecondName],
    'visitorFirstName': [visitorFirstName],
    'visitorFatherName': [visitorFatherName],
    'visitorBirthday': [visitorBirthday],
    'visitorBirthLocationStr1': [visitorBirthLocObject.part1],
    'visitorBirthLocationStr2': [visitorBirthLocObject.part2],
    'visitorPassportSeries': [passportSeri],
    'visitorPassportNum': [passportNum],
    'visitorPassportDate': [passportDate],
    'visitorPassportUnitId': [passportUnitId],
    'visitorAddressStr1': [visitorAddressObject.part1],
    'visitorAddressStr2': [visitorAddressObject.part2],
    'visitorAddressStr3': [visitorAddressObject.part3],
    'visitorCompanyStr1': [visitorCompanyObject.part1],
    'visitorCompanyStr2': [visitorCompanyObject.part2],
    'visitorPosition': [visitorPosition],
    'visitGoalStr1': [visitGoalObject.part1],
    'visitGoalStr2': [visitGoalObject.part2],

    'applierInsuranseNum': [applierInsuranse],
    'applierPhone': [applierPhone],
    'applierCompany': [applierCompany],
    'applierPosition': [applierPosition],
    'applierFirstName': [applierFirstName],
    'applierSecondName': [applierSecondName],
    'applierFatherName': [applierFatherName],
    'applierSign1': [applierSign],
    'applierSign2': [applierSign],

    'responderAdministration': 'Yes',
    'havingDocs': 'Yes'
  };

  //add to the array strs about docs, if they are passed
  const docsStr1 = commonData.docsStr1.trim().toUpperCase();
  if (docsStr1.length > 0) {
    PDFfields['docsNumStr1'] = [1];
    PDFfields['docsStr1'] = [docsStr1];
  }

  //add to the array dates' letters
  appendDateLettersToArray(commonData.applyDate, 'applyDate', PDFfields);
  appendDateLettersToArray(commonData.startDate, 'startDate', PDFfields);
  appendDateLettersToArray(commonData.expireDate, 'expireDate', PDFfields);

  return PDFfields;

}

function getCommonDataForApplying(formFields) {

  const commonData = {
    visitGoal: formFields.visitGoal,
    applierInsuranse: formFields.applierInsuranse,
    applierPhone: formFields.applierPhone,
    applierCompany: formFields.applierCompany,
    applierPosition: formFields.applierPosition,
    applierFullName: formFields.applierFullName,
    applyDate: formFields.applyDate,
    startDate: formFields.startDate,
    expireDate: formFields.expireDate,
    docsStr1: formFields.docsStr1
  };

  return commonData;

}

function createPDFsFromXlsData(formFiles, commonData, arrayBufferPDF, resultCreatePDFs) {

  //open xls file
  const workbook = xlsx.readFile(formFiles.fileXls.filepath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: true });

  //process xls data to create pdf for every row
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    //get array of fields to fill them into pdf
    const fieldsPDF = getPDFFileds(row, commonData);

    //create new PDF from template with array of fields
    const fileNum = rowIndex + 1;
    let pathOutputFile = outputFilesDir + 'output' + fileNum + '.pdf';
    let BufferPDF = Buffer.from(pdfFormJS.transform(arrayBufferPDF, fieldsPDF).buffer);
    fs.writeFileSync(pathOutputFile, BufferPDF);

    //write file's existence into status var
    resultCreatePDFs.pdfsCreated = fs.existsSync(pathOutputFile);

    if (!resultCreatePDFs.pdfsCreated) {
      //stop creating pdfs if at least one wasn't created
      break;
    };
  };

}

function createPdfs(formFields, formFiles) {

  //clear output dirs
  removeFilesFromDir(outputFilesDir);
  removeFilesFromDir(path.join(rootDir, globals.downloadsDir));

  //get template PDF's data
  const bufPDF = fs.readFileSync(pathEmptyApplication);
  const arrayBufferPDF = new Uint8Array(bufPDF).buffer;

  //get common data for filling pdfs
  const commonData = getCommonDataForApplying(formFields);

  //set default to status of creating pdfs
  const resultCreatePDFs = { 'pdfsCreated': false };

  //create pdfs and filling them using xls data
  createPDFsFromXlsData(formFiles, commonData, arrayBufferPDF, resultCreatePDFs);

  if (resultCreatePDFs.pdfsCreated) {

    //put PDFs into zip
    let zipParams = {
      zipPath: '',
      zipName: ''
    };

    zipPDFs(outputFilesDir, zipParams);

    //write that creating of zip was launched and zip's path into exported vars
    setZipParams(true, zipFinished, zipParams.zipPath, zipParams.zipName)
  }

};

setZipParamsToDefault();

//export functions and vars
module.exports.createPdfs = createPdfs;
module.exports.setZipParamsToDefault = setZipParamsToDefault;
module.exports.getZipCreatingLaunched = getZipCreatingLaunched;
module.exports.getZipPath = getZipPath;
module.exports.getZipName = getZipName;
module.exports.getZipFinished = getZipFinished;