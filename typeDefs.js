import {gql} from "apollo-server-express";


const typeDefs = gql`

 scalar DateTime
 
 
 type Query {
 	users: [User]
 	user(id: ID!): User
 	messagesByUser(receiverId: Int!): [Message]
 }
 
 input UserRegisterInput {
 	firstName: String!
 	lastName: String!
 	email: String!
 	password:String!
 }
 
 input UserSigninInput {
 	email: String!
 	password:String!
 }
 
 input MessageInput {
 	text: String!
 	receiverId:Int!
 }
 
 type Token {
 	token: String!
 }
 type Message {
 	id: ID!
 	text: String!
 	receiverId: Int!
 	senderId: Int!
 	createdAt: DateTime!
 }
 
 type Mutation { 
 	signupUser(input: UserRegisterInput!): User
 	signinUser(input: UserSigninInput!): Token
 	createMessage(input: MessageInput!): Message
 }
 
 type User {
 	id: ID!
 	firstName: String!
 	lastName: String!
 	email: String!
 	createdAt: DateTime!
 }

 type Subscription {
 	messageAdded: Message
 }
`

export default typeDefs;