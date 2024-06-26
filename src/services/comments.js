const CircuitBreaker = require('opossum');
const Http = require('../utils/http');
const redis = require('../utils/redis');

class CommentsService {
	#client;
	#cbGetComments;

	constructor() {
		this.#client = new Http('http://localhost:3002');

		const getCommentsFn = async (postId, limit = 5) => {
			const key = `comments:${postId}:${limit}`;
			const staleKey = `comments-stale:${postId}:${limit}`;

			const dataFromCache = await redis.get(key);
			if (dataFromCache) {
				return JSON.parse(dataFromCache);
			}

			const data = await this.#client.request(
				{
					method: 'GET',
					path: `/comments`,
					query: {
						postId,
					},
				},
				{
					timeout: 1000,
				}
			);
			const comments = [];
			for (const comment of data) {
				if (comment.length >= limit) continue;

				comments.push({
					id: comment.id,
					text: comment.text,
					userId: comment.userId,
				});
			}

			await redis
				.pipeline()
				.set(key, JSON.stringify(comments), 'EX', 60)
				.set(staleKey, JSON.stringify(comments), 'EX', 6000)
				.exec();

			return comments;
		};
		this.#cbGetComments = new CircuitBreaker(getCommentsFn, {
			errorThresholdPercentage: 10,
			resetTimeout: 10000,
			timeout: 1000,
		});
		this.#cbGetComments.fallback(async (postId, limit = 5) => {
			const staleKey = `comments-stale:${postId}:${limit}`;

			const dataFromCache = await redis.get(staleKey);
			if (dataFromCache) {
				return JSON.parse(dataFromCache);
			}

			return [];
		});
	}

	/**
	 *
	 * @param {number} postId
	 * @param {number} limit
	 * @returns
	 */
	async getComments(postId, limit = 5) {
		// const { rejects, failures, fallbacks, successes } =
		// 	this.#cbGetComments.stats;
		// console.log({ rejects, failures, fallbacks, successes });
		const response = this.#cbGetComments.fire(postId, limit);
		return response;
	}
}

module.exports = CommentsService;
