//node imports
var Console = require("console");
var fs = require("fs");

//external lib imports
var JsonFile = require("jsonfile");

var users = {};
var config;

module.exports = (_config) => {
	config = _config || require("./config.json");

	this.onReady = (bot) => {
		if (fs.existsSync(config.saveFile))
			users = JsonFile.readFileSync(config.saveFile); //load any data we already have stored
		Console.log(users);

		writeToFile();
	};

	this.onMessage = (bot, user, userID, channelID, message) => {
		users[userID] = new Date(); //save this message as the user's last active date
		Console.log(users);
	};

	return this;
};

var writeToFile = () => {
	JsonFile.writeFile(config.saveFile, users, (err) => { if (err) Console.error(err); });
	// let saveIntervalMs = config.saveIntervalMins * 60 * 1000;
	let saveIntervalMs = 1000;
	setTimeout(writeToFile, saveIntervalMs);
};