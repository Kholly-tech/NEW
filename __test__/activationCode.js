

const emailContent = `Click the following link to activate your account: ${activationLink}`;
    await sendEmail(email, "Activate Your Account", emailContent);




    const sendActivationMail = async (req, res) => {
        try {
          const { email, id } = req.user;
      
          //Check if user exists 
          const user = await User.findOne({ email });
          if(!user){
            res.status(404).json({message: 'User not Found'});
          }
          //Generate Token with user Id
          const activationToken = generateToken(user._id);
      
          // Construct activation link
          const activationLink = `${process.env.BASE_URL}/activate?token=${activationToken}`;
      
          // Send activation email
          
      
          res.status(200).json({ message: "Activation email sent successfully" });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Internal server error" });
        }
      };
      


      const mailContent = `Your Account has been created successfully!. Visit the link below to verify your account. \n\n ${verificationCode} \n The code expires in 15 minutes!`;



       html: `
      <p>Hello ${user_name},</p>
      <p>Click the link below to activate your account:</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>If you did not request this activation, please ignore this email.</p>
    `,