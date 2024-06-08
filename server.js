import {createRequire} from "module";

const require = createRequire(import.meta.url);

import {ApolloServer} from 'apollo-server-express'
import typeDefs from "./typeDefs.js";
import resolvers from "./resolvers.js";
import jwt from "jsonwebtoken";

import express from "express";
import {createServer} from 'http';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {WebSocketServer} from 'ws';
import {useServer} from 'graphql-ws/lib/use/ws';

const cors = require('cors')
const app = express()

const httpServer = createServer(app);
const context = ({req}) => {
	const {authorization} = req.headers
	if (authorization) {
		const {userId} = jwt.verify(authorization, process.env.JWT_SECRET)
		return {userId}
	}
}
const schema = makeExecutableSchema({ typeDefs, resolvers });


// await apolloServer.start()
// apolloServer.applyMiddleware({app, path: "/graphql"})

// Creating the WebSocket server
const wsServer = new WebSocketServer({
	// This is the `httpServer` we created in a previous step.
	server: httpServer,

	// Pass a different path here if app.use
	// serves expressMiddleware at a different path
	path: '/graphql-sub',

});
// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

const apolloServer = new ApolloServer({
	schema,
	context,
	plugins: [
		// Proper shutdown for the HTTP server.
		ApolloServerPluginDrainHttpServer({ httpServer }),

		// Proper shutdown for the WebSocket server.
		{
			async serverWillStart() {
				return {
					async drainServer() {
						await serverCleanup.dispose();
					},
				};
			},
		},
	],
});

await apolloServer.start();

apolloServer.applyMiddleware({app, path: "/graphql"})
app.use('/', cors());
app.use('/graphql', cors);

const PORT = process.env.PORT || 4000;

// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
	console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});

// const server = app.listen(4000, () => {
// 	const wsServer = new WebSocketServer({
// 		server,
// 		path: '/graphql',
// 	})
//
// 	useServer({schema, context}, wsServer);
// 	console.log('Apollo and Subscription server is up.');
// });


