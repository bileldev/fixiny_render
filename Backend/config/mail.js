const nodemailer = require('nodemailer')

// const transporter = nodemailer.createTransport({

//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: process.env.APP_MAIL,
//       pass: process.env.APP_MAIL_KEY
//     }


// })
/*const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.APP_MAIL,
      pass: process.env.APP_MAIL_KEY
    },
    debug: true,      // Enables detailed SMTP traffic logs
    logger: true      // Outputs logs to the console
})*/

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,  // Explicitly require TLS
    tls: {
        rejectUnauthorized: false  // May help with certificate issues
    },
    auth: {
        user: process.env.APP_MAIL,
        pass: process.env.APP_MAIL_KEY
    },
    debug: true,
    logger: true
})
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});





module.exports = transporter;

