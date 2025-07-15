const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.APP_MAIL,
      pass: process.env.APP_MAIL_KEY
    }


})

module.exports = transporter;