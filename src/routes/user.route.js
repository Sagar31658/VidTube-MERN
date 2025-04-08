import { Router } from "express";
import {registerUser, loginUser, logoutUser, refreshAccessToken, resetPassword, getCurrentUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ])
    ,registerUser)

userRouter.route('/login').post(loginUser)

//Secured Routes
userRouter.route('/logout').post(verifyJwt, logoutUser)
userRouter.route('/refresh-token').post(refreshAccessToken)
userRouter.route('/reset-password').post(verifyJwt, resetPassword)
userRouter.route('/current-user').get(verifyJwt, getCurrentUser)

export default userRouter