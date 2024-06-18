const CircuitBreaker = require('opossum');
const Http = require('../utils/http');

class UsersService {
	#client;
	#cbGetUser;

	constructor() {
		this.#client = new Http('http://localhost:3003');
		this.#cbGetUser = new CircuitBreaker(
			async (ids) => {
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
			},
			{
				timeout: 3000,
				errorThresholdPercentage: 50,
			}
		);
		this.#cbGetUser.fallback(() => {});
	}

	/**
	 *
	 * @param {number[]} ids
	 * @returns
	 */
	async getUsers(ids) {
		return this.#cbGetUser.fire(ids);
	}
}

module.exports = UsersService;
