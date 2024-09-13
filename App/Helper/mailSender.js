const nodemailer = require("nodemailer");

const usermail = process.env.MAIL_USERNAME;
const password = process.env.MAIL_PASSWORD;
const smtp = process.env.HOST_SMTP;

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: smtp,
    port: 465,
    secure: true,
    // send: true,
    auth: {
        user: usermail, // Your email address
        pass: password, // Your password for the email address
    },
});

// Function to send email

const sendMail = (mailRecipient, subject, mailContent, mailSender) => {
    // Setup email data
    let mailOptions = {
        from: mailSender, // Sender email address
        to: mailRecipient, // Recipient email address
        subject: subject, // Subject line
        html: mailContent, // Plain html body
    };

    // Send email
    const isMessageSent = false;
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error occurred:", error.message);
        } else {
            isMessageSent = true;
            console.log("Email sent successfully!");
            console.log("Message ID:", info.messageId);
            console.log(info.response);
        }
    });
};

module.exports = sendMail;