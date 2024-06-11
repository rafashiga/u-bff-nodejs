posts:
	json-server mock/posts.json -p 3001 --middlewares ./mock/random-delay.js
comments:
	json-server mock/comments.json -p 3002 --delay 500
users:
	json-server mock/users.json -p 3003 --middlewares ./mock/random-delay.js