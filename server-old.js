import {ApolloServer} from 'apollo-server'
import typeDefs from "./typeDefs.js";
import resolvers from "./resolvers.js";
import jwt from "jsonwebtoken";


const serverOld = new ApolloServer({
	typeDefs,
	resolvers,
	context: ({req}) => {
		const { authorization } = req.headers
		if (authorization) {
			const {userId} = jwt.verify(authorization, process.env.JWT_SECRET)
			return {userId}
		}
	}
});

serverOld.listen(4000).then(({url}) => {
	console.log(` Server running at ${url}`);
});