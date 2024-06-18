const fastify = require('fastify');
const PostsController = require('./controllers/posts');

const app = fastify({
	logger: false,
});

const postsController = new PostsController();

app.get('/posts', async (req, res) => {
	const posts = await postsController.getPosts();

	return res.send(posts);
});

app.get('/posts/:id', async (req, res) => {
	const postId = req.params.id;
	const posts = await postsController.getPost(postId);
	return res.send(posts);
});

app.listen({ port: 3333 }, (error) => {
	if (error) throw error;
	console.log('Running...');
});
