//node imports
const Console = require("console");
const FileSystem = require("fs");

//external lib imports
const Discord = require("discord.js");
const JsonFile = require("jsonfile");
const DateDiff = require("date-diff");

//my imports
const GuildSetupHelper = require("./guild-setup-helper.js");
const Util = require("./util.js");

//gloabl vars
const setupHelpers = [];

//when loaded with require() by an external script, this acts as a kind of "on ready" function
module.exports = (client) => {
	//load data from file and set up periodic saving back to file
	let guildsData = FileSystem.existsSync("./guilds.json") ? JsonFile.readFileSync("./guilds.json") : {};
	setTimeout(() => JsonFile.writeFile("./guilds.json", guildsData, err => Util.dateError(err)), config.saveIntervalSec * 1000);

	const config = require("./config.json");

	//check all the users against the threshold now, and set up a recurring callback to do it again after 24 hours
	Activity.checkUsersInAllGuilds(client.guilds, guildsData, () => {
		var waitMs = 1 * 24 * 60 * 60 * 1000; //get 1 day in ms
		var doCheck = () => {
			Activity.checkUsersInAllGuilds(client.guilds, guildsData);
			setTimeout(() => doCheck, waitMs);
		};

		doCheck();
	});

	client.on("message", message => {
		if (message.member.permissions.has("ADMINISTRATOR") && message.member.id !== client.user.id) {

			if (message.content === config.commands.setup && !setupHelpers.find(x => x.guild.id === message.guild.id)) {
				const helper = new GuildSetupHelper(message);
				let idx = setupHelpers.push(helper);
				helper.walkThroughSetup(client, message.channel, message.member).then(guildData => {
					guildsData[message.guild.id] = guildData;
					setupHelpers.splice(idx, 1);
				}).catch(Util.dateError);
			}
			
			else if (message.content === config.commands.purge)
				Activity.checkUsersInAllGuilds([message.channel.guild], guildsData);
			else if (message.content === config.commands.registerExisting)
				Activity.registerExisting(message.channel.guild, guildsData);
		}

		Activity.registerActivity(client, message, guildsData);
	});
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
			if (guildData && guildData.users && guildData.activeRoleID && guildData.activeRoleID.length > 0) {
				let activeRole = guild.roles.get(guildData.activeRoleID);

				//iterate over all the users we have *stored data* for, calculate the time difference since they were last active
				//remove the active role from them if they have been inactive for too long
				Object.keys(guildData.users).forEach(userID => {
					let activeDate = guildData.users[userID];
					let diff = new DateDiff(now, Date.parse(activeDate));

					if (diff.days() > guildData.inactiveThresholdDays) {
						guild.members.get(userID).removeRole(activeRole).catch(Util.dateError);
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

			if (guildData.allowRoleAddition && guildData.activeRoleID && guildData.activeRoleID.length > 0) { //check if we're allowed to assign roles as well as remove them in this guild
				let activeRole = guild.roles.get(guildData.activeRoleID);

				//if the member doesn't already have the active role, and they aren't in the list of ignored IDs, give it to them
				if (!member.roles.get(activeRole.id) && !guildData.ignoredUserIDs.includes(message.member.id))
					member.addRole(activeRole).catch(Util.dateError);
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