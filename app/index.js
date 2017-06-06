//node imports
var Console = require("console");
var fs = require("fs");

//external lib imports
var JsonFile = require("jsonfile");
var DateDiff = require("date-diff");

var users = {};
var config;

module.exports = (_config = require("./config.json")) => {
	config = _config;

	this.onReady = (bot) => {
		if (fs.existsSync(config.saveFile))
			users = JsonFile.readFileSync(config.saveFile); //load any data we already have stored

		writeToFile();
		checkUsersAgainstThreshold(bot);

		bot.on("any", event => {
			if (isChannelJoinEvent(event))
				onActivity(bot, event.d.user_id);
		});
	};

	this.onMessage = (bot, user, userID, channelID, message) => {
		onActivity(bot, userID);
	};

	this.commands = [
		{
			command: config.checkNowCommand,
			type: "equals",
			action: (bot) => { checkUsersAgainstThreshold(bot, false); },
			userIDs: config.developers
		},
		{
			command: config.registerExistingCommand,
			type: "equals",
			action: (bot, user, userID, channelID) => registerExisting(bot, channelID),
			userIDs: config.developers
		}
	];

	return this;
};

var onActivity = (bot, userID) => {
	if (!config.ignoredUserIDs.includes(userID)) {
		users[userID] = new Date(); //save this message as the user's last active date
		if (!bot.servers[config.serverID].members[userID].roles.includes(config.activeRoleID))
			bot.addToRole({
				serverID: config.serverID,
				userID: userID,
				roleID: config.activeRoleID
			}, (err, response) => { if (err) Console.error(err, response); });
	}
};

var writeToFile = () => {
	JsonFile.writeFile(config.saveFile, users, (err) => { if (err) Console.error(err); });
	let saveIntervalMs = parseFloat(config.saveIntervalMins) * 60 * 1000;
	setTimeout(writeToFile, saveIntervalMs);
};

var checkUsersAgainstThreshold = (bot, doSetTimeout = true) => {
	var now = new Date(); //get current date
	var inactiveThresholdDays = parseFloat(config.inactiveThresholdDays); //get an integer for the number of days a user must have been inactive for before the role is removed
	Object.keys(users).forEach(userID => { //iterate over the user IDs
		var diff = new DateDiff(now, Date.parse(users[userID])); //calculate the difference between the current date and the last time the user was active

		//remove the "active" role from the user if they haven't been active within the threshold, give them it if they have
		if (diff.days() > inactiveThresholdDays) {
			bot.removeFromRole({
				serverID: config.serverID,
				userID: userID,
				roleID: config.activeRoleID
			}, (err, response) => { if (err) Console.error(err, response); });

			delete users[userID]; //un-save the user's last active time, as they don't matter anymore
		}
		else
			bot.addToRole({
				serverID: config.serverID,
				userID: userID,
				roleID: config.activeRoleID
			}, (err, response) => { if (err) Console.error(err, response); });
	});

	//set the timeout to wait before this function should recur
	if (doSetTimeout) {
		var waitMs = (parseFloat(config.checkActivityIntervalDays)) * 24 * 60 * 60 * 1000;
		setTimeout(() => { checkUsersAgainstThreshold(bot); }, waitMs);
	}
};

var registerExisting = (bot, channelID) => {
	Console.log(users);
	var now = new Date();
	var members = bot.servers[config.serverID].members;
	var memberIDs = Object.keys(members);
	memberIDs.forEach(memberID => {
		if (members[memberID].roles.includes(config.activeRoleID))
			users[memberID] = now;
	});
	bot.sendMessage({
		to: channelID,
		message: "Registered all users who currently have the role " + bot.servers[config.serverID].roles[config.activeRoleID].name
	}, (err, response) => { if (err) Console.error(err, response); });
	Console.log(users);
};

var isChannelJoinEvent = (event) => {
	//it is a channel join event if it is a voice event, and has supplied a channel id
	return event.t === "VOICE_STATE_UPDATE" && event.d.channel_id;
};