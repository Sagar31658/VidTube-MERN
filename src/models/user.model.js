import mongoose, {Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique: true,
            lowercase: true,
            index: true
        },
        fullName:{
            type:String,
            required:true,
            trim: true
        },
        avatar:{
            type:String,
            require: true
        },
        coverImage: {
            type: String,
        },
        email:{
            type:String,
            required:true,
            lowercase: true,
            unique: true,
            index: true,
            trim: true
        },
        password:{
            type:String,
            required: [true, 'Password is required']
        },
        refreshToken:{
            type: String,
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            }
        ]
    },
    {
        timestamps: true
    }
)

userSchema.pre(async function(next) {
    if (!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods(async function isPasswordCorrect(password) {
    return await bcrypt.compare(password, this.password)
})

userSchema.methods(function generateAccessToken() {
    return jwt.sign({ 
        userId: this._id,
        username: this.username,
        email: this.email,
        }, 
        process.env.ACCESS_TOKEN,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
})

userSchema.methods(function generateRefreshToken() {
    return jwt.sign({ 
        userId: this._id,
        }, 
        process.env.REFRESH_TOKEN,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
})

export const User = mongoose.model("User", userSchema)