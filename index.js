import dotenv from 'dotenv';
dotenv.config()
import  {ApolloServer, gql, UserInputError} from 'apollo-server'
import Author from './models/author.js'
import Book from './models/book.js'
import User from './models/user.js'
import jwt from 'jsonwebtoken'
import connectdb from './models/db.js'
import user from './models/user.js';

connectdb();


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
        allAuthors:async ()  => await Author.find({})
    },
    Mutation:{
        addBook:async (root, args) =>{
            let authorId = ""
            try{
                const author = await Author.findOne({name :args.author} )
                
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
                const savedBook = await newBook.save()
                
                return  await Book.findById(savedBook._id).populate("author")
            }catch(error){
                throw new UserInputError(error.message, {
                    invalidArgs:args
                })
            }
        },
        editAuthor:async(root, args) => {
            const {name, setBornTo} = args
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
    Author:{
        bookCount:async(root)=>{
            const count= await Book.count({'author':root.id}); 
            return count
        }
    }

}

const server = new ApolloServer({typeDefs, resolvers});
server.listen().then(({url})=>{
    console.log(`Server running at ${url}`)
})