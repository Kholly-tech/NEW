const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sendMail = require('./mailSender');
const userAgentParser = require('user-agent-parser');
const deviceDetector = require('device-detector');
const { encrypt } = require('./encryption');

async function generateDeviceFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';

    const deviceDetails = userAgentParser(userAgent);
    // console.log(Au"From User Agent Parser", deviceDetails);

    const deviceInfo = deviceDetector.parse(userAgent);
    // console.log("From Device Detector", deviceInfo);

    let device = {
        type: deviceInfo.type,
        browserName: deviceDetails.browser.name,
        browserVersion: deviceDetails.browser.version,
        osName: deviceDetails.os.name,
        osVersion: deviceDetails.os.version,
        engineName: deviceDetails.engine.name,
        engineVersion: deviceDetails.engine.version,
        cpu: deviceDetails.cpu.architecture,
        userAgent: deviceInfo.userAgent,
    }

    device = JSON.stringify(device);
    const fingerprintData = `${device}`;
    return fingerprintData;
}

module.exports = { generateDeviceFingerprint };