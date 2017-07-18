const Console = require("console");

Console.dateError = (...args) => {
	args = ["[", new Date().toUTCString(), "]"].concat(args);
	Console.error.apply(this, args);
};

module.exports = {
	dateError: Console.dateError
};