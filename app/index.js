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

module.exports = (client) => { //when loaded with require() by an external script, this acts as a kind of "on ready" function
	var guildsData;
	var config = require(CONFIG_FILE);

	guildsData = Guilds.File.loadFromFile(SAVE_FILE); //load saved data from file on start up
	Guilds.File.setSaveToFileInterval(SAVE_FILE, guildsData, config.saveIntervalSec * 1000); //set up regular file saving

	//check all the users against the threshold now, and set up a recurring callback to do it again after 24 hours
	Activity.checkUsersInAllGuilds(client.guilds, guildsData, () => {
		var waitMs = 1 * 24 * 60 * 60 * 1000; //get 1 day in ms
		var doCheck = () => {
			Activity.checkUsersInAllGuilds(client.guilds, guildsData);
			setTimeout(() => doCheck, waitMs);
		};

		doCheck();
	});

	client.on("message", (message) => {
		if (message.member.id === message.guild.ownerID) { //owner only commands
			if (message.content === config.commands.setup)
				Guilds.walkThroughGuildSetup(client, message, guildsData);
			else if (message.content === config.commands.purge)
				Activity.checkUsersInAllGuilds([message.channel.guild], guildsData);
			else if (message.content === config.commands.registerExisting)
				Activity.registerExisting(message.channel.guild, guildsData);
		}

		Activity.registerActivity(client, message, guildsData);
	});
};

var Guilds = {
	File: new function () {
		this.loadFromFile = (saveFile) => {
			if (FileSystem.existsSync(saveFile))
				return JsonFile.readFileSync(saveFile, (err) => Console.dateError(err));
			else return {};
		};

		this.saveToFile = (saveFile, guildsData) => {
			JsonFile.writeFile(saveFile, guildsData, (err) => { if (err) Console.dateError(err); });
		};

		this.setSaveToFileInterval = (saveFile, guildsData, intervalMs) => {
			this.saveToFile(saveFile, guildsData); //save the file
			setTimeout(() => this.setSaveToFileInterval(saveFile, guildsData, intervalMs), intervalMs); //set up a timeout to save the file again
		};
	},

	SetupHelper: class {
		constructor(message) {
			this.guild = message.channel.guild;
			this.guildData = { users: {} };
			this.currentStepIdx = -1;

			this.setupSteps = [
				{
					message: "How many days would you like to set the inactive threshold at?",
					action: (message) => {
						//expect the message to be an integer value
						this.guildData.inactiveThresholdDays = parseInt(message.content);
					}
				},
				{
					message: "Please @tag the role you with to use to indicate an 'active' user",
					action: (message) => {
						//expect the message to be in the format @<snowflake>
						this.guildData.activeRoleID = message.content.replace(/\D+/g, "");
					}
				},
				{
					message: "Would you like the bot to *add* people to this role if they send a message and *don't* already have it? (yes/no)",
					action: (message) => {
						//expect the message to be "yes" or "no"
						this.guildData.allowRoleAddition = message.content.toLowerCase() === "yes";
					}
				},
				{
					message: "Please @tag all the roles you wish to be *exempt* from role removal (type 'none' if none)",
					action: (message) => {
						//expect the message to either be "none" or in the format '@<snowflake> @<snowflake> @<snowflake>'
						this.guildData.ignoredUserIDs = [];
						if (message.content !== "none") {
							var snowflakes = message.content.split(" ");
							snowflakes.forEach(x => this.guildData.ignoredUserIDs.push(x.replace(/\D+/g, "")));
						}
					}
				}
			];
		}

		doWalkThroughGuildSetup(client, initialMessage) {
			var doResolve;
			var promiseGuild = new Promise((resolve, reject) => {
				doResolve = resolve;
			});

			var handler = (message) => {
				if (message.member.id === message.guild.ownerID) {
					if (this.currentStepIdx >= 0)
						this.setupSteps[this.currentStepIdx].action(message);

					this.currentStepIdx++;

					if (this.currentStepIdx <= this.setupSteps.length - 1)
						message.reply(this.setupSteps[this.currentStepIdx].message).catch(Console.dateError);
					else {
						client.removeListener("message", handler);
						message.reply("Setup all done!").catch(Console.dateError);
						doResolve(this.guildData);
					}
				}
			};

			client.on("message", handler);
			handler(initialMessage);

			return promiseGuild;
		}
	},

	walkThroughGuildSetup: (client, message, guildsData) => {
		var setupHelper = new Guilds.SetupHelper(message);
		setupHelper.doWalkThroughGuildSetup(client, message).then(guildData => {
			let guildID = message.guild.id;
			if (guildsData[guildID])
				guildData.users = guildsData[guildID].users; //extract any existing user data present, ie if we're overwriting existing guild settings

			guildsData[guildID] = guildData;

			Guilds.File.saveToFile(SAVE_FILE, guildsData);
		}).catch(Console.dateError);
	},
};

var Activity = {
	/**
		 * @param {object} clientGuilds client.guilds object from the discord.js client
		 * @param {object} guildsData data from the guilds.json file
		 * @param {function} [callback] callback executed once all the users have been checked
		 */
	checkUsersInAllGuilds: (clientGuilds, guildsData, callback) => {
		let now = new Date();

		//iterate over all our guilds and subsequently all of their users
		//check each user against that guild's threshold
		clientGuilds.forEach(guild => {
			let guildData = guildsData[guild.id];
			if (guildData && guildData.users && guildData.activeRoleID) {
				let activeRole = guild.roles.get(guildData.activeRoleID);

				//iterate over all the users we have *stored data* for, calculate the time difference since they were last active
				//remove the active role from them if they have been inactive for too long
				Object.keys(guildData.users).forEach(userID => {
					let activeDate = guildData.users[userID];
					let diff = new DateDiff(now, Date.parse(activeDate));

					if (diff.days() > guildData.inactiveThresholdDays) {
						guild.members.get(userID).removeRole(activeRole).catch(Console.dateError);
						delete guildData.users[userID]; //un-save the user's last active time, as they don't matter anymore
					}
				});
			}
		});

		if (callback)
			callback();
	},
	registerActivity: (client, message, guildsData) => {
		let guild = message.channel.guild, guildData = guildsData[guild.id];
		if (guildData) {
			let member = message.member;

			guildData.users[member.id] = new Date(); //store now as the latest date this user has interacted

			if (guildData.allowRoleAddition) { //check if we're allowed to assign roles as well as remove them in this guild
				let activeRole = guild.roles.get(guildData.activeRoleID);

				//if the member doesn't already have the active role, and they aren't in the list of ignored IDs, give it to them
				if (!member.roles.get(activeRole.id) && !guildData.ignoredUserIDs.includes(message.member.id))
					member.addRole(activeRole).catch(Console.dateError);
			}
		}
	},
	registerExisting: (clientGuild, guildsData) => {
		let guildData = guildsData[clientGuild.id];
		clientGuild.roles.get(guildData.activeRoleID).members.forEach(member => {
			if (!guildData.ignoredUserIDs.includes(member.id))
				guildData.users[member.id] = new Date();
		});
	}
};

Console.dateError = (...args) => {
	args = ["[", new Date().toUTCString(), "]"].concat(args);
	Console.error.apply(this, args);
};