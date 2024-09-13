const {User, OTP, Setting} = require("../Models/index");
const bcrypt = require("bcryptjs");
const { activateAccountMail } = require("../Mail/authMails");
const {
    generateToken,
    verifyToken,
    sendMail,
    generateUsername,
  } = require("../Helper");
  const {
    validateEmail,
    validatePhoneNumber,
  } = require("../Helper/validationHelper");


// GET SETTINGS
exports.getSecuritySettings =  async(req, res) => {
  try {
    const userId = req.user._id;
    const settings = await Setting.findOne({user: userId});
    if(!settings){
      return res.status(404).json({message: "User Settings not found"});
    }
    res.status(200).json({
      security: settings.security,
    });
  } catch(error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.getDataAndPrivacy = async(req, res) => {
  const userId = req.user._id;
  try{
    const setting = await Setting.findOne({user: userId});
    if(!setting){
      return res.status(404).json({message: "User Settings not found"});
    }
    res.status(200).json({
      data: setting.dataAndPrivacy,
    });
  } catch(error){
    console.log(error);
    res.status(500).send(error);
  }
};

exports.getLanguageAndDisplay = async(req, res) => {
  const userId = req.user._id;
  try{
    const setting = await Setting.findOne({user: userId});
    if(!setting){
      return res.status(404).json({message: "User Settings not found"});
    }
    res.status(200).json({
      languageAndDisplay: setting.languageAndDisplay,
    });
  } catch(error){
    console.log(error);
    res.status(500).send(error);
  }
};

// // EDIT PROFILE SECTION OF SETTINGS
exports.editProfile = async (req, res) => {
    try {
      const updatedDetails = {
        ...(req.body.bio && { bio: req.body.bio }),
        ...(req.body.workPlace && { 'details.workPlace': req.body.workPlace }),
        ...(req.body.education && {
            'details.education': Array.isArray(req.body.education)
              ? req.body.education
              : [req.body.education],
          }),
        ...(req.body.location && { 'details.location': req.body.location }),
        ...(req.body.otherName && { 'details.otherName': req.body.otherName }),
        ...(req.body.homeTown && { 'details.homeTown': req.body.homeTown }),
        ...(req.body.relationship && { 'details.relationship': req.body.relationship }),
        ...(req.body.website && { 'details.website': req.body.website }),
      };
  
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updatedDetails },
        { new: true }
      ).populate("details.location", "name address");
  
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      updatedUser.password = undefined;
      updatedUser.securePin = undefined;
      res.status(200).json({ message: "Updated", updatedUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };


// // SECURITY SECTION OF SETTINGS
  //Change Password
  exports.changePassword = async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select("+password");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
  
      // Check if old password is correct
      if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();
  
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  // Change Email Address
  exports.changeEmail = async (req, res) => {
      try{
        const { email } = req.body;
        const user = await User.findById(req.user._id);
        const existingEmail = await User.findOne({ email });
        if(!user){
          return res.status(404).json({message: "User not found"});
        }
        // check if email is valid
        if(!validateEmail(email)){
            return res.status(400).json({message: "Invalid email address"});
        }
        // check if email is already in use
        if(existingEmail && existingEmail._id != user._id){
            return res.status(400).json({message: "Email is already in use"});
        }

        //Generate Verification Code to verify user email
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
          ).toString();

        // save the code to database

        const otpRecord = new OTP({
            userEmail: user.email,
            code: verificationCode,
            reason: "emailChange",
        })
        await otpRecord.save();

        if(!email){
            return res.status(400).json({message: "Email is required"});
        }
        else if(existingEmail){
            return res.status(400).json({message: "Email is already in use"});
        }

        // Send activation email

        try {
        const subject = "Email Verification Code";
        const mailRecipient = email;
        const mailSender = process.env.NOREPLY_MAIL;
        const mailContent = activateAccountMail({
            first_name: user.first_name,
            subject: subject,
            code: verificationCode
        });
        await sendMail(mailRecipient, subject, mailContent, mailSender);
        } catch (error) {
        console.log("Error sending activation email:", error);
        }
        res.status(200).json({message: `Verification Code has beeen sent to ${email}`});
      }catch(error){
        console.log(error);
        res.status(500).send(error);
  }
};

exports.verifyEmail = async (req, res) => {
    try{
        const { code, email } = req.body;
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        const otpRecord = await OTP.findOne({
            userEmail: user.email,
            code: code,
            reason: "emailChange",
        });
        if (!otpRecord) {
            return res.status(404).json({message: "Invalid code"});
        }

        const now = new Date();
        console.log(`${otpRecord.createdAt}\t${now}`);
        const diff = now - otpRecord.createdAt;
        const diffMinutes = diff / 1000 / 60;
        console.log(diffMinutes);
        if (diffMinutes > 10) {
            return res.status(404).json({message: "Code expired"});
        }
        user.email = email;
        // user.details.education = "";
        await user.save();
        await OTP.deleteMany({userEmail: user.email, reason: "emailChange"});
        res.status(200).json({message: "Email changed successfully"});
    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
};

exports.changeNumber = async (req, res) => {
    try{
        const { oldNumber, newNumber } = req.body;
        const user = await User.findById(req.user._id);
        const existingPhoneNumber = await User.findOne({ phone_number: newNumber });

        //check if user exist
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        // check if the old number belongs to the user
        else if(user.phone_number !== oldNumber){
            return res.status(404).json({message: "Invalid old number"});
        }
        // check if the new number is valid
        else if(!newNumber || !validatePhoneNumber(newNumber)){
            return res.status(404).json({message: "Invalid new number"});
        }
        // check if the new number already belongs to someone
        else if(existingPhoneNumber){
            return res.status(404).json({message: "Number is already in use"});
        }

        // save the number after validation
        user.phone_number = newNumber;
        await user.save();
        res.status(200).json({message: "Number changed successfully"});
    }catch(error){
        console.log(error);
        res.status(500).send(error);
    }
};

// // DATA PRIVACY SECTION OF SETTINGS

exports.updateSettings = async (req, res) => {
    try {
      const updates = req.body;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }
  
      const user = await Setting.findOne({ userId: req.user._id })
      .populate("userId", "first_name last_name username email");
  
      if (user) {
        const validFields = ['profileVisibility', 'timelineAndTagging', 'mediaVisibility', 'messaging', 'postVisibility', 'dataUsage'];
        const invalidFields = Object.keys(updates).filter(field => !validFields.includes(field));
  
        if (invalidFields.length > 0) {
          return res.status(400).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
        }
  
        for (const field in updates) {
          user.dataAndPrivacy[field] = updates[field];
        }
  
        await user.save();
        res.status(200).json({ message: 'Settings updated successfully' });
      } else {
        const setting = new Setting({
          userId: req.user._id,
          dataAndPrivacy: updates,
        });
        await setting.save();
        res.status(200).json({ message: 'Settings updated successfully' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  };

// Lock profile
exports.lockProfile = async (req, res) => {
    try{
        const user = await Setting.findOne({ userId: req.user._id });
        console.log(user);
        if(user){
            console.log(user.dataAndPrivacy);
            console.log(user.dataAndPrivacy.lockProfile);
            user.dataAndPrivacy.lockProfile = true;
            await user.save();
        }
        else{
            const setting =  new Setting({
                userId : req.user._id, 
                dataAndPrivacy: {
                    lockProfile: true
                }
            });
            await setting.save();
        }
        res.status(200).json({message: "Profile locked successfully"}); 
    } catch(error){
        console.log(error);
        res.status(500).send(`Unable to lock profile: ${error}`);
    }
};

exports.updateLanguage = async (req, res) => {
    try{
        const updates = req.body;

        if(Object.keys(updates).length === 0){
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        const user = await Setting.findOne({ userId: req.user._id });

        if(user){
            const validFields = ['language', 'theme', 'accessibility'];
            const invalidFields = Object.keys(updates).filter(field => !validFields.includes(field));
    
            if (invalidFields.length > 0) {
                return res.status(400).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
            }
    
            for (const field in updates) {
                user.languageAndDisplay[field] = updates[field];
            }
            await user.save();
        }
        else {
            const setting = new Setting({
                userId: req.user._id,
                languageAndDisplay: updates
            });
            await setting.save();
        }

        res.status(200).json({message: "Language changed successfully"});
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
};

exports.deletAccount = async (req, res) => {
    try{
        const user = await User.findById(req.user._id);
        if(!user){
            res.status(404).json({message: "User not found"});
        }
        await User.findByIdAndDelete(req.user._id);
        res.status(200).json({message: "Account deleted successfully"});
    } catch(error){
        console.log(error);
        res.status(500).send(error);
    }
}

//$2a$10$ydZTftoVgzhGpnowpzhzCePQIPEpbp1IfK90ijXzCfJCVjA2DhfPa