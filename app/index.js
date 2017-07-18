//node imports
const Console = require("console");
const FileSystem = require("fs");

//external lib imports
const Discord = require("discord.js");
const JsonFile = require("jsonfile");

//my imports
const GuildSetupHelper = require("./guild-setup-helper.js");
const GuildData = require("./guild-data.js");
const Util = require("./util.js");

//gloabl vars
const setupHelpers = [];

//when loaded with require() by an external script, this acts as a kind of "on ready" function
module.exports = (client) => {
	const config = require("./config.json");

	//load data from file and set up periodic saving back to file
	const guildsData = FileSystem.existsSync("./guilds.json") ? fromJSON(JsonFile.readFileSync("./guilds.json")) : {};
	setInterval(() => JsonFile.writeFile("./guilds.json", guildsData, err => Util.dateError(err)), config.saveIntervalSec * 1000);

	//check all the guild members against their guild's threshold now, and set up a daily check
	Activity.checkUsersInAllGuilds(client, guildsData);
	setInterval(() => Activity.checkUsersInAllGuilds(client, guildsData), 1 * 24 * 60 * 60 * 1000);

	client.on("message", message => {
		if (message.member.permissions.has("ADMINISTRATOR") && message.member.id !== client.user.id) {

			if (message.content === config.commands.setup && !setupHelpers.find(x => x.guild.id === message.channel.guild.id)) {
				const helper = new GuildSetupHelper(message);
				let idx = setupHelpers.push(helper);
				helper.walkThroughSetup(client, message.channel, message.member).then(guildData => {
					guildsData[message.channel.guild.id] = guildData;
					setupHelpers.splice(idx, 1);
				}).catch(Util.dateError);
			}

			else if (message.content === config.commands.purge)
				Activity.checkUsersInAllGuilds(client, guildsData);
			else if (message.content === config.commands.registerExisting)
				Activity.registerExisting(message.channel.guild, guildsData[message.channel.guild.id]);
		}

		Activity.registerActivity(message.guild, message, guildsData[message.channel.guild.id]);
	});
};

const Activity = {
	checkUsersInAllGuilds: (client, guildsData) => client.guilds.forEach(guild => guildsData[guild.id].checkUsers(client)),
	registerActivity: (guild, message, guildData) => {
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
	registerExisting: (guild, guildData) => {
		guild.roles.get(guildData.activeRoleID).members.forEach(member => {
			if (!guildData.ignoredUserIDs.includes(member.id))
				guildData.users[member.id] = new Date();
		});
	}
};

const fromJSON = json => {
	Object.keys(json).forEach(guildID => {
		json[guildID] = new GuildData().fromJSON(json[guildID]);
	});
	return json;
};