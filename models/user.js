import mongoose  from 'mongoose'
const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        minLength:3,
    },
    favoriteGenre:{
        type:String,
        required:true,
        unique:false,
        minLength:3
    }
})
export default mongoose.model('User', UserSchema)