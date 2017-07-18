//node imports
const FileSystem = require("fs");

//external lib imports
const JsonFile = require("jsonfile");

//my imports
const GuildSetupHelper = require("./guild-setup-helper.js");
const GuildData = require("./guild-data.js");
const Util = require("./util.js");

//gloabl vars
const SAVE_FILE = "./guilds.json";
const setupHelpers = [];

//when loaded with require() by an external script, this acts as a kind of "on ready" function
module.exports = (client) => {
	const config = require("./config.json");

	//load data from file and set up periodic saving back to file
	const guildsData = FileSystem.existsSync(SAVE_FILE) ? fromJSON(JsonFile.readFileSync(SAVE_FILE)) : {};
	setInterval(() => writeFile(guildsData), config.saveIntervalSec * 1000);

	//check all the guild members against their guild's threshold now, and set up a daily check
	Activity.checkUsersInAllGuilds(client, guildsData);
	setInterval(() => Activity.checkUsersInAllGuilds(client, guildsData), 1 * 24 * 60 * 60 * 1000);

	client.on("message", message => {
		if (message.member.permissions.has("ADMINISTRATOR") && message.member.id !== client.user.id) {

			if (message.content === config.commands.setup && !setupHelpers.find(x => x.guild.id === message.channel.guild.id)) {
				const helper = new GuildSetupHelper(message);
				let idx = setupHelpers.push(helper);
				const existingUsers = guildsData[message.channel.guild.id] ? guildsData[message.channel.guild.id].users : null;
				helper.walkThroughSetup(client, message.channel, message.member, existingUsers)
					.then(guildData => {
						guildsData[message.channel.guild.id] = guildData;
						writeFile(guildsData);
						message.reply("Setup complete!");
					})
					.catch(err => {
						Util.dateError(err);
						message.reply("An error occured, setup will now terminate");
					})
					.then(() => setupHelpers.splice(idx - 1, 1));
			}

			else if (message.content === config.commands.purge) {
				const guildData = guildsData[message.channel.guild.id];
				if (guildData)
					guildData.checkUsers(client);
			}
			else if (message.content === config.commands.registerExisting) {
				const guildData = guildsData[message.channel.guild.id];
				if (guildData)
					Activity.registerExisting(message.channel.guild, guildData);
			}
		}

		Activity.registerActivity(message.guild, message, guildsData[message.channel.guild.id]);
	});
};

const Activity = {
	checkUsersInAllGuilds: (client, guildsData) => client.guilds.forEach(guild => {
		const guildData = guildsData[guild.id];
		if (guildData) {
			guildData.checkUsers(client);
			writeFile(guildsData);
		}
	}),
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

function writeFile(guildsData) {
	JsonFile.writeFile(SAVE_FILE, guildsData, err => { if (err) Util.dateError(err); });
}

function fromJSON(json) {
	Object.keys(json).forEach(guildID => {
		json[guildID] = new GuildData().fromJSON(json[guildID]);
	});
	return json;
}