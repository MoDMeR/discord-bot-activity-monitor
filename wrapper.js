const Discord = require("discord.js");
const client = new Discord.Client();

client.login(require("./token.json").token);

client.on("ready", () => {
	require("./app/index.js")(client);
});