const Http = require('../utils/http');

class PostsService {
	#client;

	constructor() {
		this.#client = new Http('http://localhost:3001');
	}

	/**
	 *
	 * @param {number} limit
	 * @returns
	 */
	async getPosts(limit = 2) {
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
	}

	/**
	 *
	 * @param {number} id
	 * @returns
	 */
	async getPost(id) {
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
	}
}

module.exports = PostsService;
