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
      allBooks(author:String genre:String!):[Book!]!
      allAuthors:[Author]!
  }
`
const resolvers = {
    Query:{
        bookCount:() => books.length,
        authorCount:() => authors.length,
        allBooks:(root, args) =>{
            const {author, genre} = args
            console.log(author, genre)
            let booksFiltered =[]
            if(author){
                booksFiltered =books.filter(book => book.author == author && book.genres.some(element => element== genre))
            }
            else{
                booksFiltered =books.filter(book => book.genres.some(element => element== genre)) 
            }
            
            return booksFiltered
        } ,
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