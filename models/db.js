import mongoose from 'mongoose'
const connect = ()=>{
    const MONGO_URL = process.env.MONGO_URL
    console.log(MONGO_URL)
    mongoose.connect(MONGO_URL)
    .then(() => {
        console.log('connected to MongoDB')
      })
      .catch((error) => {
        console.log('error connection to MongoDB:', error.message)
      })
    
}
export default connect;
