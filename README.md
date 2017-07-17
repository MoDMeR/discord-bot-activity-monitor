# Discord activity monitor

A discord bot to assign/remove a role from users in your guild based on whether or not they have been active lately.

## Features

- Removes a role from a user who has not been active for a number of days
- Add the role to a user when they become active again (optional)
- Ignores specified users, eg if you don't want bots to be marked 'active'
- Configurable number of days before users are marked inactive

## Inviting the bot

Invite the bot to your server [here](https://discordapp.com/oauth2/authorize?client_id=336600010592485379&scope=bot&permissions=0)

## Configuring the bot

### Permissions:

Required for normal functionality:
- Manage Roles
- Read Messages (in the channels you wish the bot to "monitor")

Required for setup only:
- Send messages

### Configuration

Ensure:
- The guild owner is the one running the setup
- The "active" role is *mentionable* for the duration of the setup
- The bot has *read* and *write* permissions to the channel being used for setup

Steps:
- Run `!activitymonitor setup` in a channel the bot can *read* and *write* in
- Respond with the information the bot asks you for, until setup is complete

Example: ![example image](http://i.imgur.com/s60poam.png)

## Feedback

Please contact me with any issues you have regarding the bot, I am not a perfect programmer so it's totally possible that there are some! If any issues arise, I will do my best to fix them ASAP, and can usually respond pretty quickly.

Whilst I can't make any promises, I welcome any feature suggestions or feedback regarding functionality, so don't hesitate to contact me if you wish :)

Contact methods:
- [Submit an issue via GitHub](https://github.com/benji7425/discord-bot-activity-monitor/issues)
- [Use the contact email on my GitHub profile](https://github.com/benji7425)
- Contact me directly on Discord: benji7425#1782
