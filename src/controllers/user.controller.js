import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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
    const coverImagePath = req.files?.coverImage[0]?.path

    if (!avatarPath){
        throw new ApiError(401, "Please upload an avatar")
    }

    const avatar = await uploadToCloudinary(avatarPath)
    const coverImage = await uploadToCloudinary(coverImagePath)

    const user = await User.create({
        username: username.toLowerCase(), fullName, email, password, avatar: avatar.url, coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if (!createdUser){
        throw new ApiError(401, "Failed to create user")
    }

    return res.status(201).json(
        new ApiResponse("User is Registered", createdUser, 200)
    )
})

export default registerUser;