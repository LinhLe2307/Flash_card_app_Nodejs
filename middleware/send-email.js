const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = ( recipient_email, token) => {
    return new Promise((resolve, reject) => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MY_EMAIL,
          pass: process.env.MY_PASSWORD
        }
      });

      const convertedToken = token.replaceAll('.', '@')
  
      const mail_configs = {
        from: process.env.MY_EMAIL,
        to: recipient_email,
        subject: 'Card.IO PASSWORD RECOVERY',
        html: `<h1>Reset Your Password</h1>
        <p>Click on the following link to reset your password:</p>
        <a href="http://flash-card-io.netlify.app/reset-password/${convertedToken}">https://flash-card-io.netlify.app/reset-password/${convertedToken}</a>
        <p>The link will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        `
      }
      transporter.sendMail(mail_configs, function (error, info) {
        if (error) {
          console.log(error);
          return reject({ message: `An error has occured` });
        }
        return resolve({ message: "Email sent succesfuly" });
      })
  
    })
  }

module.exports = sendEmail