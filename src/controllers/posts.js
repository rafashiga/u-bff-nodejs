const CommentsService = require('../services/comments');
const PostsService = require('../services/posts');
const UsersService = require('../services/users');

const postsService = new PostsService();
const commentsService = new CommentsService();
const userService = new UsersService();

class PostsController {
	constructor() {}

	async getPosts() {
		const posts = await postsService.getPosts();

		const authorIds = new Set();
		for (const post of posts) {
			authorIds.add(post.authorId);
		}

		const users = await userService.getUsers([...authorIds]);
		for (const post of posts) {
			post.author = users.get(post.authorId);
		}

		return posts;
	}

	/**
	 * @param {number} id
	 */
	async getPost(id) {
		// Fetch Data
		// console.time('request');
		const [post, comments] = await Promise.all([
			postsService.getPost(id),
			commentsService.getComments(id),
		]);
		// console.timeEnd('request');

		// Mount user id
		const userIds = new Set([post.authorId]);
		for (const comment of comments) {
			userIds.add(comment.userId);
		}

		// Fetch users
		const users = await userService.getUsers([...userIds]);

		// Transform user data
		post.authorName = users.get(post.authorId);
		for (const comment of comments) {
			comment.user = users.get(comment.userId);
		}

		return { ...post, comments };
	}
}

module.exports = PostsController;
