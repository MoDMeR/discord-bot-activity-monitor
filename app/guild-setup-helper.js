const Util = require("./util.js");
const GuildData = require("./guild-data.js");

const setupSteps = [
	{
		message: "How many days would you like to set the inactive threshold at?",
		action: (message, responseData) => {
			//expect the message to be an integer value
			responseData.inactiveThresholdDays = parseInt(message.content) | 30;
		}
	},
	{
		message: "Please @tag the role you with to use to indicate an 'active' user",
		action: (message, responseData) => {
			//expect the message to be in the format @<snowflake>
			responseData.activeRoleID = message.content.split(" ")[0].replace(/\D+/g, "");
		}
	},
	{
		message: "Would you like the bot to *add* people to this role if they send a message and *don't* already have it? (yes/no)",
		action: (message, responseData) => {
			//expect the message to be "yes" or "no"
			responseData.allowRoleAddition = message.content.toLowerCase() === "yes";
		}
	},
	{
		message: "Please @tag all the roles you wish to be *exempt* from role removal (type 'none' if none)",
		action: (message, responseData) => {
			//expect the message to either be "none" or in the format '@<snowflake> @<snowflake> @<snowflake>'
			responseData.ignoredUserIDs = [];
			if (message.content !== "none") {
				var snowflakes = message.content.split(" ");
				snowflakes.forEach(x => responseData.ignoredUserIDs.push(x.replace(/\D+/g, "")));
			}
		}
	}
];

module.exports = class {
	constructor(message) {
		this.guild = message.channel.guild;
		this.currentStepIdx = -1;
	}

	walkThroughSetup(client, textChannel, member) {
		return new Promise((resolve, reject) => {
			var responseData = {};
			//use a closure to count up the steps
			const askNext = (() => {
				let i = 0;
				return () => {
					if (i <= setupSteps.length)
						//ask in the channel and wait for the promised response before asking the next question
						Util.ask(client, textChannel, member, setupSteps[i].message).then(response => {
							setupSteps[i].action(response, responseData);
							askNext();
						}).catch(reject);
					else
						resolve(new GuildData(this.guild.id, responseData.inactiveThresholdDays, responseData.activeRoleID, responseData.allowRoleAddition, responseData.ignoredUserIDs));
				};
			})();
		});
	}
};