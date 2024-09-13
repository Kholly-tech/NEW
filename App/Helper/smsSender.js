const twilio = require("twilio");
const axios = require('axios');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const sendSMS = async(phoneNumber, message) => {
    try {
        const client = twilio(accountSid, authToken);
        // const response = await client.messages.create({
        //     body: message,
        //     from: process.env.MESSAGING_SERVICES_ID,
        //     to: phoneNumber,
        // });

        const nMessage = await client.verify.v2
            .services("VAf9e729a60ae58ddfe96ee2f1465cbc2c")
            .verifications.create({
                to: phoneNumber,
                channel: "sms",
                customMessage: message,
            });
        console.log("Message:", nMessage);
        // console.log("Response:", response);
        return nMessage;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const sendSMSWithSefan = async(phoneNumber, message) => {
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${process.env.SEFAN_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const data = {
            recipient: phoneNumber,
            sender_id: process.env.SMS_SENDER_ID,
            type: "plain",
            message: message,
        };

        const response = axios.post(`${process.env.SEFAN_API_ENDPOINT}`, data, config)
            .then(function(response) {
                console.log(response.data);
                return response.data;
            })
            .catch(function(error) {
                // console.log(error);
                console.log(error.response.data);
                console.log("Not Sent");
                return false;
            });
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = { sendSMS, sendSMSWithSefan };