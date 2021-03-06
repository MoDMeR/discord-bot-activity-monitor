const Console = require("console");
const SimpleFileWriter = require("simple-file-writer");

const logWriter = new SimpleFileWriter("./log");

module.exports = {
	dateError: (...args) => {
		args = ["[", new Date().toUTCString(), "] "].concat(args);
		Console.error.apply(this, args);
		logWriter.write(args.join("") + "\n");
	},

	/**
 	* Returns a promise that the user will answer
 	* @param {TextChannel} textChannel discord.js TextChannel to ask the question in
 	* @param {GuildMember} member discord.js Member to ask the question to
 	* @param {string} question question to ask
 	*/
	ask: (client, textChannel, member, question) => {
		//return a promise which will resolve once the user next sends a message in this textChannel
		return new Promise((resolve, reject) => {
			const handler = responseMessage => {
				if (responseMessage.channel.id === textChannel.id &&
					responseMessage.member.id === member.id) {
					client.removeListener("message", handler);
					resolve(responseMessage);
				}
			};

			client.on("message", handler);

			textChannel.send(member.toString() + " " + question).catch(reject);
		});
	}
};