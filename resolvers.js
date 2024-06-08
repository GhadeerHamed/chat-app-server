import {PrismaClient} from '@prisma/client'
import {ApolloError, AuthenticationError, ForbiddenError} from "apollo-server-express";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {PubSub} from 'graphql-subscriptions'

const pubSub = new PubSub()
const prisma = new PrismaClient()

const MESSAGE_ADDED = 'MESSAGE_ADDED'
const resolvers = {
	Query: {
		users: async (_, args, {userId}) => {
			if (!userId) throw new ForbiddenError('You must login.')
			return prisma.user.findMany({
				orderBy: {
					createdAt: 'desc'
				},
				where: {
					id: {
						not: userId
					}
				}
			});
		},
		messagesByUser: async (_, {receiverId}, {userId}) => {
			if (!userId) throw new ForbiddenError('You must login.')

			return prisma.message.findMany({
				where: {
					OR: [
						{senderId: userId, receiverId : receiverId},
						{senderId: receiverId, receiverId : userId}
					]
				},
				orderBy: {
					createdAt: 'asc'
				}
			})
		}
	},
	Mutation: {
		signupUser: async (_, { input }) => {
			const  user = await prisma.user.findUnique({where: {email: input.email}})
			if (user) throw new AuthenticationError(`User with email ${input.email} already exists`)

			const password = await bcrypt.hash(input.password, 10)
			return prisma.user.create({
				data: {
					...input,
					password: password
				}
			});
		},
		signinUser: async (_, { input }) => {
			const  user = await prisma.user.findUnique({where: {email: input.email}})
			if (!user) throw new AuthenticationError(`User doesn't exists`)

			const match = await bcrypt.compare(input.password, user.password)
			if (!match) throw new AuthenticationError(`Wrong credentials.`)

			const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET)
			return {token}
		},
		createMessage: async (_, { input }, {userId}) => {
			if (!userId) throw new ForbiddenError('You must login.')
			if (userId == input.receiverId) throw new ApolloError('You cannot send messages to yourself.')

			const message =  prisma.message.create({
				data: {
					receiverId: input.receiverId,
					text: input.text,
					senderId: userId,
				}
			})

			await pubSub.publish(MESSAGE_ADDED, {messageAdded: message})
			return message
		}
	},
	Subscription: {
		messageAdded: {
			subscribe: () => pubSub.asyncIterator(MESSAGE_ADDED)
		}
	}
}

export default resolvers;