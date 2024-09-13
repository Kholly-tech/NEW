const parseCookie = (cookieString) => {
    const cookies = {};
    cookieString.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts[1].trim();
        cookies[name] = value;
    });
    // console.log("Cookies from processor", cookies);
    return cookies;
};

module.exports = { parseCookie };