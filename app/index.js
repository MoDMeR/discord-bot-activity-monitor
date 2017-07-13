//node imports
const Console = require("console");
const FileSystem = require("fs");

//external lib imports
const JsonFile = require("jsonfile");
const DateDiff = require("date-diff");

//const vars
const CONFIG_FILE = "./config.json";
const SAVE_FILE = "./users.json";

//global vars
var users = {};
var config = require(CONFIG_FILE);

module.exports = (client) => { //when loaded with require() by an external script, this acts as a kind of "on ready" function
	users = Users.loadFromFile(SAVE_FILE); //load saved data from file on start up

};

var Users = new function () {
	this.loadFromFile = (saveFile) => {
		if (fs.existsSync(saveFile)) //if there exists a users.json file
			return JsonFile.readFileSync(saveFile); //load the data found in it
		else
			return {}; //else return an empty object
	}
	this.saveToFile = (saveFile, users) => {
		JsonFile.writeFile(saveFile, users, (err) => { if (err) Console.dateError(err); });
	}
	this.setSaveToFileInterval = (saveFile, users, intervalMs) => {
		this.saveFile(saveFile, users); //save the file
		setTimeout(this.setSaveToFileInterval, intervalMs); //set up a timeout to save the file again
	}
}

Console.dateError = (...args) => {
	args = ["[", new Date().toUTCString(), "]"].concat(args);
	Console.error.apply(this, args);
};