const express = require('express')
const cors = require('cors')
const { ApolloServer } = require('apollo-server-express')
require('dotenv').config()
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')

const db = require('./db')
const models = require('./models')
const typeDefs = require('./schema')
// Provide resolver functions for our schema fields
const resolvers = require('./resolvers')
const jwt = require('jsonwebtoken')

const helmet = require('helmet')

const port = process.env.PORT || 4000

const DB_HOST = process.env.DB_HOST

db.connect(DB_HOST)

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }))
app.use(cors())


// get the user infom from a JWT
const getUser = token => {
    if(token){
        try{
            return jwt.verify(token, process.env.JWT_SECRET)
        } catch(err) {
            // if there's a problem with the token, throw an error
            throw new Error('Session invalid')
        }
    }
}


// Apollo Server setup
const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    validationRules: [ depthLimit(5), createComplexityLimitRule(1000)],
    context: ({ req }) => {
        // get the user token from the header
        const token = req.headers.authorization
        // try to retrieve a user with the token
        const user = getUser(token)
        // for now, let's log the user to the console.
        // get the user token 
        return { models, user }
    } });




// Apply the Apollo GraphQL middleware and set the path to /api
server.applyMiddleware({ app, path: '/api' });

app.listen({ port }, () =>
  console.log(
    `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
  )
);