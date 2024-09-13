const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const validateEmail = (email) => {
  return emailRegex.test(email);
};

const validatePhoneNumber = (phoneNumber) => {
  return phoneNumberRegex.test(phoneNumber);
};

const validatePassword = (password) => {
  return passwordRegex.test(password);
};

module.exports = {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
};
