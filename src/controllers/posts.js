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

		const resultsPromise = posts.map(async (post) => {
			const user = await userService.getUser(post.authorId);

			return {
				...post,
				authorId: undefined,
				author: user?.name,
			};
		});

		const result = await Promise.all(resultsPromise);

		return result;
	}

	/**
	 * @param {number} id
	 */
	async getPost(id) {
		// Fetch Data
		const [post, comments] = await Promise.all([
			postsService.getPost(id),
			commentsService.getComments(id),
		]);

		const postAuthor = await userService.getUser(post.authorId);
		const commentsPromise = comments.map(async (comment) => {
			const commentAuthor = await userService.getUser(comment.userId);
			return {
				...comment,
				user: commentAuthor.id,
				userId: undefined,
			};
		});

		return {
			...post,
			author: postAuthor.name,
			authorId: undefined,
			comments: await Promise.all(commentsPromise),
		};
	}
}

module.exports = PostsController;
