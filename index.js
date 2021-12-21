import dotenv from 'dotenv';
dotenv.config()
import  {ApolloServer, gql, UserInputError, AuthenticationError} from 'apollo-server-express'
import {createServer} from 'http'
import express, { response } from 'express'
import {execute, subscribe} from 'graphql' 
import { SubscriptionServer } from 'subscriptions-transport-ws';
import Author from './models/author.js'
import Book from './models/book.js'
import User from './models/user.js'
import jwt from 'jsonwebtoken'
import connectdb from './models/db.js'
import user from './models/user.js';
import {PubSub} from 'graphql-subscriptions'
import { makeExecutableSchema } from '@graphql-tools/schema'; 

connectdb();
const PORT=4000
const  pubsub = new PubSub()
const app = express()
const httpServer = createServer(app)


const typeDefs = gql `
  type Book{
      title:String!
      published:Int!
      author:Author!
      id:ID!
      genres:[String!]!
  }
  type Author{
      id:ID!
      name:String!
      born:Int
      bookCount:Int!
  }
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  
  type Token {
    value: String!
  }
  
  type Query {
      bookCount:Int!
      authorCount:Int!
      allBooks(author:String genre:String):[Book!]!
      allAuthors:[Author]!
      me: User
  }
  type Mutation{
      addBook(title:String! author:String! published:Int! genres:[String!]!):Book

      editAuthor(name:String! setBornTo:Int!):Author

      createUser(
        username: String!
        favoriteGenre: String!
      ): User

      login(
        username: String!
        password: String!
      ): Token
  }
  type Subscription{
    bookAdded:Book!
  }
`
const resolvers = {
    Query:{
        bookCount:async () => await Book.countDocuments(),
        authorCount:async() => await Author.countDocuments(),
        allBooks:async ( root,args) =>{
            const {author, genre} = args
            let filters = {}
            if(author)
                filters['author'] =author
            if(genre)
                filters['genres'] =[genre]
            
            return Book.find(filters).populate("author").exec()
        } ,
        allAuthors:async ()  => await Author.find({}),
        me:(root, args, context)=>{
          return context.currentUser;
        }
    },
    Mutation:{
        addBook:async (root, args, context) =>{
            let authorId = ""
            try{

                const author = await Author.findOne({name :args.author} )
                if(!context.currentUser){
                  throw new AuthenticationError("No authenticated")
                }
                
                if(author)
                {
                    authorId = author._id
                    author.bookCount =  author.bookCount+1
                    await author.save();
                }
                else{
                    const newAuthor = new Author({
                        name: args.author,
                        born: null,
                        bookCount:1
                    })
                    newAuthor.save()
                    authorId = newAuthor._id;
                }
                const newBook = new Book({...args, author:authorId})
                const savedBook = await newBook.save()                
                const response=  await Book.findById(savedBook._id).populate("author")
                pubsub.publish("BOOK_ADDED", {bookAdded: response})
                return response
            }catch(error){
                throw new UserInputError(error.message, {
                    invalidArgs:args
                })
            }
        },
        editAuthor:async(root, args, context) => {
            const {name, setBornTo} = args
            if(!context.currentUser){
              throw new AuthenticationError("No authenticated")
            }
            const result = await Author.findOneAndUpdate({name:name}, {born:setBornTo},{new:true})
            return result   
        },
        createUser:async(root,args)=>{
            try {
                const newUser = new User({...args})
                const savedUser = await newUser.save();
                return await User.findById(savedUser.id)
            }catch(error){
                throw new UserInputError(error.message)
            }
        },
        login:async(root, args)=>{
            const {username, password} = args
            const user = await User.findOne({username:username})
            const secret = process.env.JWT_SECRET 
            if(user && password=="secret"){
                const userForToken = {
                    user:username,
                    id:user._id
                }
                const token =jwt.sign(userForToken, secret);
                return {value:token}
            }
            
            return null
        }

    },
    Subscription:{
      bookAdded:{
        subscribe:()=>pubsub.asyncIterator(["BOOK_ADDED"])
      }
    }

}
const schema = makeExecutableSchema({typeDefs, resolvers})
const server = new ApolloServer({
  schema,
  context:async({req}) =>{
    const auth = req ? req.headers.authorization : null 
    if(auth && auth.toLowerCase().startsWith('bearer ')){
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id)
      return {currentUser}
    }

  } 
});
await server.start()
server.applyMiddleware({app})
SubscriptionServer.create(
  {schema, execute, subscribe},
  {server:httpServer, path:server.graphqlPath}
)
httpServer.listen(PORT, ()=>{
  console.log(
    `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
  );
})