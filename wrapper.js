const Discord = require("discord.js");
const client = new Discord.Client();

var app = require("./app/index.js")(client);

client.login(require("./token.json").token);