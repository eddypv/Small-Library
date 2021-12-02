import  {ApolloServer, gql} from 'apollo-server'
import authors from './Data/authors.js'
import books from './Data/books.js'

const typeDefs = gql `
  type Book{
      title:String!
      published:Int!
      author:String!
      id:ID!
      genres:[String!]!
  }
  type Author{
      id:ID!
      name:String!
      born:Int
      bookCount:Int!
  }
  type Query {
      bookCount:Int!
      authorCount:Int!
      allBooks:[Book!]!
      allAuthors:[Author]!
  }
`
const resolvers = {
    Query:{
        bookCount:() => books.length,
        authorCount:() => authors.length,
        allBooks:() => books,
        allAuthors:()  => authors
    },
    Author:{
        bookCount:(root)=>{
            const count= books.filter(element => element.author == root.name).length;
            return count
        }
    }

}

const server = new ApolloServer({typeDefs, resolvers});
server.listen().then(({url})=>{
    console.log(`Server running at ${url}`)
})