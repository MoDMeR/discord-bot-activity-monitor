# Changelog

## v2.0.1

### Fixed

- Bot able to get stuck in setup mode forever
- Bot replying to itself if it has admin permissions
- Incorrect reply formats during setup causing various problems

## v2.0.1

### Updated

- Any administrator can now perform the setup

### Fixed

- Fixed issue where guild could enter setup multiple times
- Fixed a couple of errors that caused the bot to crash when it should have just logged them

## v2.0.0

### Updated

- Updated core library to use discord.js rather than discord.io (discord.js handles rate limiting automatically)
- Updated bot to support multiple guilds, rather than requiring a new instance for each one

## Added

- Guild setup helper via in-chat commands

### Fixed

- Fixed rate limit issues when assigning/removing roles from users (by switching to discord.js)
- Prevent attempt to re-assign existing roles to users
- Add date + time to logged errors

## v1.2.0

### Added

- Add config option to ignore certain IDs

## v1.1.0

### Added

- Command to register all existing users with the "active" role assigned to them with last active time as "now"
	- Useful when setting up the bot for the first time, and the role is already in use

## v1.0.0

### Features

- Assigns users a role to mark them as active when they send a message or join a voice channel
- Checks at a configurable interval to see if any users have been inactive for longer than a configurable threshold
- Users have the "active" role removed after a configurable period of inactivity