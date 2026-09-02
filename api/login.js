const { handleLogin } = require('./auth');

module.exports = (req, res) => {
    return handleLogin(req, res);
};
