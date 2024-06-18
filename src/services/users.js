const CircuitBreaker = require('opossum');
const Http = require('../utils/http');
const redis = require('../utils/redis');

class UsersService {
	#client;
	#cbGetUser;

	constructor() {
		this.#client = new Http('http://localhost:3003');
		this.#cbGetUser = new CircuitBreaker(
			async (id) => {
				const key = `user${id}`;
				const dataFromCache = await redis.get(key);
				if (dataFromCache) return JSON.parse(dataFromCache);

				const data = await this.#client.request(
					{
						method: 'GET',
						path: `/users/${id}`,
					},
					{
						timeout: 3000,
					}
				);

				const result = {
					id: data.id,
					name: data.name,
				};

				await redis.set(key, JSON.stringify(result), 'EX', 60);
				return result;
			},
			{
				timeout: 3000,
				errorThresholdPercentage: 50,
			}
		);
		this.#cbGetUser.fallback(() => {});
	}

	/**
	 * @param {number} id
	 */
	async getUser(id) {
		return this.#cbGetUser.fire(id);
	}
}

module.exports = UsersService;
