const CircuitBreaker = require('opossum');
const Http = require('../utils/http');

class PostsService {
	#client;
	#cbGetPosts;
	#cbGetPost;

	constructor() {
		this.#client = new Http('http://localhost:3001');
		this.#cbGetPosts = new CircuitBreaker(
			async (limit) => {
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
						text: post.text,
						authorId: post.authorId,
					});
				}
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
				const data = await this.#client.request(
					{
						method: 'GET',
						path: `/posts/${id}`,
					},
					{
						timeout: 5000,
					}
				);
				return data;
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
	async getPosts(limit = 2) {
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
