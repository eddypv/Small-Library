import  {ApolloServer, gql} from 'apollo-server'
import authors from './Data/authors.js'
import books from './Data/books.js'

const typeDefs = gql `
  type Person{
      name:String!
      phone:String!
      street:String!
      city:String!
      id:ID!
  }
  type Query {
      bookCount:Int!
      authorCount:Int!
  }
`
const resolvers = {
    Query:{
        bookCount:() => books.length,
        authorCount:() => authors.length,
    }
}

const server = new ApolloServer({typeDefs, resolvers});
server.listen().then(({url})=>{
    console.log(`Server running at ${url}`)
})