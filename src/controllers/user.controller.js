import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something Went Wrong while generating tokens");
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    
    const {username, fullName, email, password} = req.body
    console.log("email: ",email)

    if(
        [username,fullName,email,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(401, "Please fill in all fields")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(401, "Username or Email already exists")
    }

    const avatarPath = req.files?.avatar[0]?.path  
    if (!avatarPath){
        throw new ApiError(401, "Please upload an avatar")
    }
    const avatar = await uploadToCloudinary(avatarPath)

    let coverImage
    if(Array.isArray(req.files.coverImage)){
        const coverImagePath = req.files?.coverImage[0]?.path
        coverImage = await uploadToCloudinary(coverImagePath)
    }else{
        coverImage = ""
    }

    const user = await User.create({
        username: username.toLowerCase(), 
        fullName, 
        email, 
        password, 
        avatar: avatar.url, 
        coverImage: coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select('-password -refreshToken')
    if (!createdUser){
        throw new ApiError(401, "Failed to create user")
    }

    return res.status(201).json(
        new ApiResponse("User is Registered", createdUser, 200)
    )
})

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {username, email, password} = req.body

    if(!email || !username){
        throw new ApiError(401, "Please enter your email or username")
    }

    const existedUser = await User.findOne({
        $or: [{username: username.toLowerCase()}, {email: email.toLowerCase()}],
    })
    if (!existedUser){
        throw new ApiError(401, "Invalid username or email")
    }

    console.log(existedUser)
    const isPasswordValidated = await existedUser.isPasswordCorrect(password)
    if (!isPasswordValidated){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} = generateAccessandRefreshTokens(existedUser._id)

    const loggedInUser = await User.findById(existedUser._id).select('-password -refreshToken')

    const Options = {
        httpOnly: true, // The cookie only accessible by the web server
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, Options)
        .cookie("refreshToken", refreshToken, Options)
        .json(
            new ApiResponse("User LoggedIn Successfully!",{
                user: loggedInUser, accessToken, refreshToken
            }, 200)
        )
})

export {registerUser, loginUser};