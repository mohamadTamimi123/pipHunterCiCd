
import {adminLogin, createUser, getMe, userList, userLogin, userOtp, userRegister} from "../controller/user.controller";
import express from "express";

import {createUserMiddleware, getUserListMiddleWare} from "../../middleware/permitions";
import {checkUserRole} from "../../middleware/checkRole";



const userRoute = express.Router();


userRoute.post('/auth/register', userRegister)
userRoute.post('/auth/otp', userOtp)

userRoute.post('/auth/login', userLogin)



userRoute.post('/auth/admin-login', adminLogin)

userRoute.get('/users/list' , getUserListMiddleWare , userList)

userRoute.get('/user/create', createUserMiddleware ,  createUser)




userRoute.get('/auth/get-me', getMe)

export { userRoute }


