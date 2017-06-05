# Changelog

## 1.1.0

### Added

- Command to register all existing users with the "active" role assigned to them with last active time as "now"
	- Useful when setting up the bot for the first time, and the role is already in use

## 1.0.0

### Features

- Assigns users a role to mark them as active when they send a message or join a voice channel
- Checks at a configurable interval to see if any users have been inactive for longer than a configurable threshold
- Users have the "active" role removed after a configurable period of inactivity