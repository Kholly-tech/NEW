// generate user name 
const { User } = require("../Models/index");
const generateUsername = async (username) => {
  let a = false;
  do {
    let checkUsername = await User.findOne({ username: username });
    if (checkUsername) {
      username += (+new Date() * Math.random()).toString().substring(0, 1);
      a = true;
    } else {
      a = false;
    }
  } while (a);
  return username;
};

module.exports = generateUsername;