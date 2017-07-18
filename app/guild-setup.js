const Console = require("console");
const Util = require("./util.js");

module.exports = class {
	constructor(message) {
		this.guild = message.channel.guild;
		this.guildData = { users: {} };
		this.currentStepIdx = -1;

		inSetup.push(message.guild.id); //record that this guild is currently in setup mode
	}

	static isInSetup(guild){ return inSetup.includes(guild.id); }

	doWalkThroughGuildSetup(client, initialMessage) {
		var doResolve;
		var promiseGuild = new Promise((resolve, reject) => {
			doResolve = resolve;
		});

		var handler = (message) => {
			if (message.member.permissions.has("ADMINISTRATOR")) {
				if (this.currentStepIdx >= 0)
					setupSteps[this.currentStepIdx].action(message);

				this.currentStepIdx++;

				if (this.currentStepIdx <= setupSteps.length - 1)
					message.reply(setupSteps[this.currentStepIdx].message).catch(Util.dateError);
				else {
					client.removeListener("message", handler);
					message.reply("Setup all done!").catch(Util.dateError);
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

Console.dateError = (...args) => {
	args = ["[", new Date().toUTCString(), "]"].concat(args);
	Console.error.apply(this, args);
};