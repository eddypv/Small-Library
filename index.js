import  {ApolloServer, gql} from 'apollo-server'
import authorsData from './Data/authors.js'
import booksData from './Data/books.js'
import {v1 as uuidv1, v1} from 'uuid'
let authors = authorsData
let books = booksData
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
  type Mutation{
      addBook(title:String! author:String! published:Int genres:[String!]!):Book
      editAuthor(name:String! setBornTo:Int!):Author
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
    Mutation:{
        addBook:(root, args) =>{
            const newBook = {...args}
            const author = authors.find(element => element.name == newBook.author) 
            console.log(author)
            if(author == undefined)
                authors.push({
                    name: newBook.author,
                    id: uuidv1(),
                    born: null,
                })
            books.push(newBook)
            return newBook

        },
        editAuthor:(root, args) => {
            const {name, setBornTo} = args
            let author = authors.find(element => element.name == name);
            if(author == undefined)
                return null 
            authors= authors.map(element=> {
                if(element.name == name){
                    element.born = setBornTo
                    author = element
                }
                    
                return element
            })
            return author
        }
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