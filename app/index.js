//node imports
var Console = require("console");
var fs = require("fs");

//external lib imports
var JsonFile = require("jsonfile");

var users;

module.exports = (_config) => {
	var config = _config || require("./config.json");

	this.onReady = (bot) => {
		if (fs.existsSync(config.saveFile))
			users = JsonFile.readFileSync(config.saveFile); //load any data we already have stored
		Console.log(users);
	};

	return this;
};

