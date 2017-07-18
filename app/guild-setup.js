const Console = require("console");
const Util = require("./util.js");

module.exports = class {
	constructor(message) {
		this.guild = message.channel.guild;
		this.guildData = { users: {} };
		this.currentStepIdx = -1;
		inSetup.push(message.guild.id); //record that this guild is currently in setup mode
		this.setupIdx = inSetup.length - 1;
	}

	static isInSetup(guild) { return inSetup.includes(guild.id); }

	doWalkThroughGuildSetup(client, initialMessage) {
		var doResolve;
		var promiseGuild = new Promise((resolve, reject) => {
			doResolve = resolve;
		});

		var handler = (message) => {
			if (message.member.permissions.has("ADMINISTRATOR") && message.member.id !== client.user.id) {
				if (this.currentStepIdx >= 0)
					setupSteps[this.currentStepIdx].action(message, this.guildData);

				this.currentStepIdx++;

				if (this.currentStepIdx <= setupSteps.length - 1)
					message.reply(setupSteps[this.currentStepIdx].message).catch(Util.dateError);
				else {
					client.removeListener("message", handler);
					message.reply("Setup all done!").catch(Util.dateError);
					inSetup.splice(this.setupIdx, 1);
					doResolve(this.guildData);
				}
			}
		};

		client.on("message", handler);
		handler(initialMessage);

		return promiseGuild;
	}
};

const inSetup = [

];

const setupSteps = [
	{
		message: "How many days would you like to set the inactive threshold at?",
		action: (message, guildData) => {
			//expect the message to be an integer value
			guildData.inactiveThresholdDays = parseInt(message.content) | 30;
		}
	},
	{
		message: "Please @tag the role you with to use to indicate an 'active' user",
		action: (message, guildData) => {
			//expect the message to be in the format @<snowflake>
			guildData.activeRoleID = message.content.split(" ")[0].replace(/\D+/g, "");
		}
	},
	{
		message: "Would you like the bot to *add* people to this role if they send a message and *don't* already have it? (yes/no)",
		action: (message, guildData) => {
			//expect the message to be "yes" or "no"
			guildData.allowRoleAddition = message.content.toLowerCase() === "yes";
		}
	},
	{
		message: "Please @tag all the roles you wish to be *exempt* from role removal (type 'none' if none)",
		action: (message, guildData) => {
			//expect the message to either be "none" or in the format '@<snowflake> @<snowflake> @<snowflake>'
			guildData.ignoredUserIDs = [];
			if (message.content !== "none") {
				var snowflakes = message.content.split(" ");
				snowflakes.forEach(x => guildData.ignoredUserIDs.push(x.replace(/\D+/g, "")));
			}
		}
	}
];