import dotenv from 'dotenv';
dotenv.config()
import  {ApolloServer, gql} from 'apollo-server'
import authorsData from './Data/authors.js'
import booksData from './Data/books.js'
import Author from './models/author.js'
import Book from './models/book.js'
import {v1 as uuidv1, v1} from 'uuid'
import connectdb from './models/db.js'

connectdb();

let authors = authorsData
let books = booksData
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
  type Query {
      bookCount:Int!
      authorCount:Int!
      allBooks(author:String genre:String):[Book!]!
      allAuthors:[Author]!
  }
  type Mutation{
      addBook(title:String! author:String! published:Int genres:[String!]!):Book
      editAuthor(name:String! setBornTo:Int!):Author
  }
`
const resolvers = {
    Query:{
        bookCount:async () => await Book.countDocuments(),
        authorCount:async() => await Author.countDocuments(),
        allBooks:async (root, args) =>{
            const {author, genre} = args
            let filters = {}
            let allBooks = []
            if(author)
                filters['author.name'] =author
            if(genre)
                filters['genres'] =[genre]
            
            return Book.find(filters).populate("author").exec()
        } ,
        allAuthors:()  => authors
    },
    Mutation:{
        addBook:async (root, args) =>{
            let authorId = ""
            console.log(args)
            const author = await Author.findOne({name :args.author} )
            console.log(author)
            if(author)
            {
                authorId = author._id
            }
            else{
                const newAuthor = new Author({
                    name: args.author,
                    born: null,
                })
                newAuthor.save()
                authorId = newAuthor._id;
            }
            const newBook = new Book({...args, author:authorId})
            return  newBook.save()

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