import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

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

    const isPasswordValidated = await existedUser.isPasswordCorrect(password)
    if (!isPasswordValidated){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(existedUser._id)

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

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set:{
            refreshToken: undefined
        }
    },{
        new: true
    })

    const options = {
        httpOnly: true, // The cookie only accessible by the web server
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse("User LoggedOut Successfully!", {}, 200)
    )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Access")
    }

    try {
        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN)
    
        const user = await User.findById(decodedToken?.userId)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired or Used")
        }
    
        const {accessToken, newRefreshToken} = await generateAccessandRefreshTokens(user._id)
        const options = {
            httpOnly: true, // The cookie only accessible by the web server
            secure: true
        }
    
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse("Access Token Refreshed Successfully!", {accessToken, refreshToken:newRefreshToken}, 200)
                )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const resetPassword = asyncHandler (async (req, res) => {
    const {oldPassword, newPassword} = req.body
    console.log(oldPassword,newPassword)
    console.log(req.user)
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old Password is Incorrect")
    }

    if(oldPassword == newPassword){
        throw new ApiError(401, "Old and New Passwords can't be Same")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse("Password Reset Successfully!", {}, 200)
    )
})

const getCurrentUser = asyncHandler( async (req,res) => {
    return res.status(200).json(
        new ApiResponse("Current User Details: ", req.user, 200)
    )
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, resetPassword, getCurrentUser};