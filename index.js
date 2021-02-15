const jwt = require("jsonwebtoken");
const fs = require('fs').promises;

//below are library passed inline. do not uncomment here
// var parser = require('simple-excel-to-json')
// const csv = require('csvtojson');
// const ObjectsToCsv = require('objects-to-csv');
const nodemailer = require("nodemailer");
//other libraries



//resposify
const responsify = (res, code, message = null, results = {}) => {
  //body=(code.toString().search("20")<0)?{results:body}:{results:body};
  //results={access_token:"1", results:results};
  if (results) {
    //To enable Postman api client read access_token from this http response
    res.status(code).send({ code, msg: message, data: results, access_token: results.access_token })
  } else {
    res.status(code).send({ code, msg: message, data: results });
  }
}

//Generate and return jwt access_token of specified user
const generateJwtAccessToken = async (res, user, expiresIn) => {

  let toReturn = {};

  jwt.sign({ user }, "MyCustomEncryptionSecretKey", { expiresIn }, (err, token) => {
    if (err) {
      //responsify(res, 500, err);
      return err

    } else {
      //return {access_token:token, expiresIn:expiresIn};
      // responsify(res, 200, "", { access_token: token });
      console.log("1111")
      toReturn["access_token"] = token;
      toReturn["expiresIn"] = expiresIn;
      console.log(toReturn.access_token)

    }
  });

  setTimeout(() => {
    console.log(toReturn)
    return toReturn;
  }, 5000)


}


//get authenticated user object
const getJwtCurentUser = (req) => {
  //Perform header-level verification first.
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // decode user access token to user object using your jwt encoding secret key;
    return jwt.decode(bearer[1], "MyCustomEncryptionSecretKey");
  } else {
    // Forbidden
    return "Bad access token";
  }

}

const reqHasToken = (req) => {
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader == 'undefined') {
    return false;
  } else {
    if (bearerHeader == null || bearerHeader == "") {
      return false;
    } else {
      return true;
    }
  }
}


// Verify jwt access_token
const jwtAuthorize = (req, res, next) => {
  //Perform header-level verification first.
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;

    //Now do jwt-level verification for the access token to check if it exist in session.
    jwt.verify(req.token, 'MyCustomEncryptionSecretKey', (err, authData) => {
      if (err) {
        responsify(res, 401, err, null);
      } else {

        //next middleware
        next();
      }
    });


  } else {
    // Forbidden
    responsify(res, 401, "Unauthorized request.", null);
  }

}

//log error in a file and complete current request with http response
const FaskErrorHandler = (res, err) => {
  //log error in a file
  //complete current http response
  responsify(res, 500, err, "System encounterred error. Please try engaing later.", null);
}

const capitalizeFirstletter = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const removeUnderScoreFromText = (text) => {
  let newTextArr = text.split("_");
  newTextArr.map((item, index) => {
    newTextArr[index] = capitalizeFirstletter(item);
  })
  const capitalizedText = newTextArr.join(" ");
  return capitalizedText.trim();
}





//other utilities
const paginateArray = async (data, page, pageSize = 10) => {
  let currentPage = Number(page), pages = 0, total = 0;
  pageSize = Number(pageSize);
  total = data.length;
  pages = (pageSize > total) ? 1 : Math.round(total / pageSize)
  let sliceFrom = (currentPage == 0) ? 0 : currentPage * pageSize - pageSize;
  let sliceTo = sliceFrom + pageSize;
  const nextPage = (currentPage == pages) ? currentPage : currentPage + 1;
  let result = { data: await data.slice(sliceFrom, sliceTo + 1), metaData: { currentPage: page, nextPage, pages, total } }
  return result;
}


//file system

const uploadBase64File = async (pathWithName, base64String) => {
  try {
    let base64File = base64String.split(';base64,').pop();
    await fs.writeFile(pathWithName, base64File, { encoding: 'base64' });
    return { uploaded: true, err: null }
  } catch (err) {
    return { uploaded: false, err: err }
  }
}


//file processing

const convertExcelAndCvsToJson = async (filePath, extension) => {

  try {
    let jsonResult = [];
    if (extension == "xls" || extension == "xlsx") {
      //is excel
      var parser = require('simple-excel-to-json')
      var result = parser.parseXls2Json(filePath);
      jsonResult = result[0];
    } else {
      //is csv
      const csv = require('csvtojson');
      const result = await csv().fromFile(filePath);
      jsonResult = result
    }

    return { converted: true, jsonResult: jsonResult, err: "" }

  } catch (err) {

    return { converted: false, jsonResult: [], err: err }
  }
}

const convertJsonToCsv = async (savePath, data) => {
  const fileName = savePath;
  const ObjectsToCsv = require('objects-to-csv');
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(fileName);
  // Return the CSV file as string:
  return fileName;
}



//string manipulation

const replaceAll = async (text, toReplace, replaceBy) => {
  const newText = text.split(toReplace).join(replaceBy);
  return newText
}

const generateRandomString = async (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const generateRandomNumber = async (length) => {
  var result = '';
  var characters = '0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  const randomNumber = Number(result);
  return randomNumber;
}


//date manipiulation

const getDateObject = async (timestamp) => {
  const timestampInt = Date.parse(timestamp);
  var date = new Date(timestampInt)
  var day = date.getDate();
  var month = date.getMonth() + 1; //Be careful! January is 0 not 1 for date.getMonth() response.
  var year = date.getFullYear();
  const result = { day, month, year }
  return result;
}

const addDaysToDate = async (days, date) => {
  const daysToMilliSecs = Number(days) * 24 * 60 * 60 * 1000;
  const newDate = new Date(new Date(date) + daysToMilliSecs);
  return newDate;
}

const getMonthLength = async (month, year) => {
  return new Date(year, month, 0).getDate();
}


//mailing
//database mail

const sendSMTPMail = async (paramObject, dbMailConnectionInfo, isLiveEmail = true) => {
  try {

    const Sequelize = require('sequelize');
    const env = process.env.NODE_ENV || 'development';
    const config = require(`C:\\inetpub\\wwwroot\\office_booking_api\\server\\config\\config.json`)[env];


    let sequelize;
    if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable]);
    } else {
      sequelize = new Sequelize(
        config.database, config.username, config.password, config
      );
    }

    const mssqlStorePrecedureExecuteQuery = 'EXEC spSendMail @mailTo=:mailTo, @mailCC=:mailCC, @mailBCC=:mailBCC, @mailSubject=:mailSubject, @mailbody=:mailbody, @profileName=:profileName';
    const result = await sequelize
      .query(mssqlStorePrecedureExecuteQuery,
        {
          replacements:
          {
            mailTo: paramObject.to,
            mailCC: (paramObject.cc) ? paramObject.cc : "",
            mailBCC: (paramObject.cc) ? paramObject.bcc : "",
            mailSubject: (paramObject.subject) ? paramObject.subject : "",
            mailbody: (paramObject.textBody) ? paramObject.textBody : "",
            profileName: dbMailConnectionInfo.dbmailProfileName,
          }
        });
    console.log(result)
    return result;
  } catch (err) {
    console.log(err);
    return "failed with: " + err;
  }
}

//direct smtp client from code
const sendSMTPMailFromCode = async (paramObject, smtpConnectionInfo, isLiveEmail = true) => {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let connectionInfo = {}
  if (isLiveEmail == true) {
    //live connectionInfo
    connectionInfo = {
      host: smtpConnectionInfo.host,
      port: smtpConnectionInfo.port,
      secure: false, // true for 465, false for other ports
      //requireTLS:true, //new addition.
      auth: {
        user: smtpConnectionInfo.username, // generated ethereal user
        pass: smtpConnectionInfo.password, // generated ethereal password
      }
    }
  } else {
    //ethereal test connection info
    // let testAccount = await nodemailer.createTestAccount();
    //console.log(testAccount);
    connectionInfo = {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "czn65ekxqpbed5bu@ethereal.email", // generated ethereal user
        pass: "7hJcX8AGkukXCtXRdp" // generated ethereal password
      }
    }

    console.log(connectionInfo);

  }


  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport(connectionInfo);

  // send mail with defined transport object
  // const mail ={
  //     from: '"Fred Foo 👻" <foo@example.com>', // sender address
  //     to: "bar@example.com, baz@example.com", // list of receivers
  //     subject: "Hello ✔", // Subject line
  //     text: "Hello world?", // plain text body
  //     html: "<b>Hello world?</b>", // html body
  //   }
  let info = await transporter.sendMail({
    from: paramObject.from, // sender address
    to: paramObject.to, // list of receivers
    subject: paramObject.subject, // Subject line
    text: paramObject.textBody, // plain text body
    html: paramObject.htmlBody, // html body
  });

  //console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  console.log(info);
  return info
}
//dbmail

const JoinExpressValidatorMessages = async (messages) => {
  let joinedMessage = null;
  for (let index = 0; index < messages.length; index++) {
    const element = messages[index];
    switch (index) {
      case 0:
        joinedMessage = element.msg;
        break;
      default:
        joinedMessage = joinedMessage + " " + element.msg;
        break;
    }
  }

  return joinedMessage;
}
//export list 
module.exports = {
  removeUnderScoreFromText,
  responsify,
  jwtAuthorize,
  generateJwtAccessToken,
  getJwtCurentUser,
  reqHasToken,
  paginateArray,
  uploadBase64File,
  replaceAll,
  generateRandomString,
  generateRandomNumber,
  convertExcelAndCvsToJson,
  convertJsonToCsv,
  getDateObject,
  addDaysToDate,
  getMonthLength,
  sendSMTPMail,
  sendSMTPMailFromCode,
  JoinExpressValidatorMessages
};