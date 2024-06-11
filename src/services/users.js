const Http = require('../utils/http');

class UsersService {
	#client;

	constructor() {
		this.#client = new Http('http://localhost:3003');
	}

	/**
	 *
	 * @param {number[]} ids
	 * @returns
	 */
	async getUsers(ids) {
		const data = await this.#client.request(
			{
				method: 'GET',
				path: `/users`,
				query: {
					id: ids,
				},
			},
			{
				timeout: 3000,
			}
		);
		const users = new Map();
		for (const user of data) {
			users.set(Number(user.id), user.name);
		}
		return users;
	}
}

module.exports = UsersService;
