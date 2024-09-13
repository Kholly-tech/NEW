// authMails.js

const fs = require("fs");
const handlebars = require("handlebars");

const activationMail = ({ first_name, activation_link }) => {
  // Read the HTML template file
  const htmlTemplate = fs.readFileSync(
    "Public/Mails/activationMail.html",
    "utf-8"
  );

  // Compile the template using Handlebars
  const template = handlebars.compile(htmlTemplate);
  const htmlContent = template({ first_name, activation_link });

  return htmlContent;
};

const activateAccountMail = ({first_name, subject, code}) => {
  // Read the HTML template file
  const htmlTemplate = fs.readFileSync(
    "Public/Mails/verificationCode.html",
    "utf-8"
  );
  const template = handlebars.compile(htmlTemplate);
  const htmlContent = template({first_name, subject, code});
  return htmlContent;
}

const findAccountOTP = ({ code, first_name, email }) => {
  // Read the HTML template file
  const htmlTemplate = fs.readFileSync(
    "Public/Mails/findAccountOTP.html",
    "utf-8"
  );
  const template = handlebars.compile(htmlTemplate);
  const htmlContent = template({ code, first_name, email });
  return htmlContent;
};

module.exports = { activationMail, activateAccountMail, findAccountOTP };
