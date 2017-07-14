//node imports
const Console = require("console");
const FileSystem = require("fs");

//external lib imports
const Discord = require("discord.js");
const JsonFile = require("jsonfile");
const DateDiff = require("date-diff");

//const vars
const CONFIG_FILE = "./config.json";
const SAVE_FILE = "./guilds.json";

//global vars
var guildsData;
var config = require(CONFIG_FILE);

module.exports = (client) => { //when loaded with require() by an external script, this acts as a kind of "on ready" function
	guildsData = Guilds.loadFromFile(SAVE_FILE); //load saved data from file on start up
	Guilds.setSaveToFileInterval(SAVE_FILE, guildsData, config.saveIntervalMins * 60 * 1000); //set up regular file saving

	//check all the users against the threshold now, and set up a recurring callback to do it again after 24 hours
	Guilds.checkUsersInAllGuilds(client.guilds, guildsData, () => {
		var waitMs = 1 * 24 * 60 * 60 * 1000; //get 1 day in ms
		setTimeout(() => Guilds.checkUsersInAllGuilds(client.guilds, guildsData), waitMs);
	});

	client.on("message", (message) => {
		if (message.content === config.commands.setup)
			Guilds.walkThroughGuildSetup(message);
		else
			registerActivity(client, message);
	});
};

var Guilds = new function () {
	this.loadFromFile = (saveFile) => {
		if (FileSystem.existsSync(saveFile))
			return JsonFile.readFileSync(saveFile);
		else
			return new Map();
	};

	this.saveToFile = (saveFile, guildsData) => {
		JsonFile.writeFile(saveFile, guildsData, (err) => { if (err) Console.dateError(err); });
	};

	this.setSaveToFileInterval = (saveFile, guildsData, intervalMs) => {
		this.saveToFile(saveFile, guildsData); //save the file
		setTimeout(this.setSaveToFileInterval, intervalMs); //set up a timeout to save the file again
	};
	/**
	 * @param {object} clientGuilds client.guilds object from the discord.js client
	 * @param {object} guildsData data from the guilds.json file
	 * @param {function} [callback] callback executed once all the users have been checked
	 */
	this.checkUsersInAllGuilds = (clientGuilds, guildsData, callback) => {
		let now = new Date();

		//iterate over all our guilds and subsequently all of their users
		//check each user against that guild's threshold
		clientGuilds.forEach(guild => {
			let guildData = guildsData.get(guild.id);
			if (guildData && guildData.users && guildData.activeRoleID) {
				let activeRole = guild.roles.get(guildData.activeRoleID);

				//iterate over all the users we have *stored data* for, calculate the time difference since they were last active
				//remove the active role from them if they have been inactive for too long
				let usersData = guildData.users;
				usersData.forEach(userData => {
					let diff = new DateDiff(now, Date.parse(guildData.users.get(userData)));

					if (diff.days() > guildData.inactiveThresholdDays) {
						guild.members.get(userData).removeRole(activeRole);
						guildData.users.delete(userData); //un-save the user's last active time, as they don't matter anymore
					}
				});
			}
		});

		if (callback)
			callback();
	};

	this.walkThroughGuildSetup = (message) => {
		message.reply("hi").then(msg =>
			Console.log(msg)).catch(Console.error);
	};
};

var GuildSetupHelper = new function () {
	this.setupSteps = [
		{ }
	]

	this.inSetup = false;
	
	
};

var Guild = class Guild {
	constructor(guildID, activeRoleID, allowRoleAddition, ignoredUserIDs) {
		this.guildID = guildID;
		this.activeRoleID = activeRoleID;
		this.allowRoleAddition = allowRoleAddition;
		this.ignoredUserIDs = ignoredUserIDs;
	}
};

var registerActivity = (client, message) => {
	let guild = client.guilds.get(message.channel.guild.id);
	if (guildsData.get(guild.id) && guildsData.get(guild.id).allowRoleAddition) { //check if we're allowed to assign roles as well as remove them in this guild
		let member = message.member;
		let activeRole = guild.roles.get(guildsData.get(guild.id).activeRoleID);
		if (!member.roles.get(activeRole.id)) //if the member doesn't already have the active role, give it to them
			member.addRole(activeRole);
	}
};

Console.dateError = (...args) => {
	args = ["[", new Date().toUTCString(), "]"].concat(args);
	Console.error.apply(this, args);
};