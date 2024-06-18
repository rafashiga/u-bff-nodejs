const CircuitBreaker = require('opossum');
const Http = require('../utils/http');
const redis = require('../utils/redis');

class PostsService {
	#client;
	#cbGetPosts;
	#cbGetPost;

	constructor() {
		this.#client = new Http('http://localhost:3001');
		this.#cbGetPosts = new CircuitBreaker(
			async (limit) => {
				const key = `posts:${limit}`;
				const dataFromCache = await redis.get(key);
				if (dataFromCache) {
					return JSON.parse(dataFromCache);
				}

				const data = await this.#client.request(
					{
						method: 'GET',
						path: '/posts',
					},
					{
						timeout: 5000,
					}
				);
				const posts = [];
				for (const post of data) {
					if (posts.length >= limit) continue;
					posts.push({
						id: post.id,
						title: post.title,
						authorId: post.authorId,
					});
				}

				await redis.set(key, JSON.stringify(posts), 'EX', 60);
				return posts;
			},
			{
				timeout: 5000,
				errorThresholdPercentage: 90,
			}
		);
		this.#cbGetPosts.fallback(() => []);

		this.#cbGetPost = new CircuitBreaker(
			async (id) => {
				//key - redis
				const key = `posts:${id}`;
				const dataFromCache = await redis.get(key);
				console.log({ key, dataFromCache });
				if (dataFromCache) {
					return JSON.parse(dataFromCache);
				}

				const data = await this.#client.request(
					{
						method: 'GET',
						path: `/posts/${id}`,
					},
					{
						timeout: 5000,
					}
				);

				const result = {
					id: data.id,
					title: data.title,
					text: data.text,
					authorId: data.authorId,
				};

				console.log('writing cache');
				await redis.set(key, JSON.stringify(result), 'EX', 60);
				return result;
			},
			{
				timeout: 5000,
				errorThresholdPercentage: 90,
			}
		);
		this.#cbGetPost.fallback(() => ({}));
	}

	/**
	 *
	 * @param {number} limit
	 * @returns
	 */
	async getPosts(limit = 5) {
		return this.#cbGetPosts.fire(limit);
	}

	/**
	 *
	 * @param {number} id
	 * @returns
	 */
	async getPost(id) {
		return this.#cbGetPost.fire(id);
	}
}

module.exports = PostsService;
