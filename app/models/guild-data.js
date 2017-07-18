module.exports = class GuildData {
	/**
	 * Constructs an instance of GuildData
	 * @param {string} id ID of the guild
	 * @param {int} inactiveThresholdDays Number of days users should be marked inactive after
	 * @param {string} activeRoleID ID of the role to use to remove from inactive users
	 * @param {object} [users = {}] Object containing user IDs as keys and DateTime as values
	 * @param {bool} [allowRoleAddition = false] Should the bot be allowed to *add* as well as remove the role?
	 * @param {string[]} [ignoredUserIDs = new Array()] IDs to ignore when checking if users are active
	 */
	constructor(id, inactiveThresholdDays, activeRoleID, users, allowRoleAddition, ignoredUserIDs) {
		this.id = id;
		this.inactiveThresholdDays = inactiveThresholdDays;
		this.activeRoleID = activeRoleID;
		this.users = users instanceof Object ? users : {};
		this.allowRoleAddition = allowRoleAddition ? true : false;
		this.ignoredUserIDs = Array.isArray(ignoredUserIDs) ? ignoredUserIDs : [];
	}
};