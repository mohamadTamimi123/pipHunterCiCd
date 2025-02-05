import passport from "passport";

import {
    checkOtpCode,
    createUserController,
    register,
    returnAuthInfo,
    userInfoController,
    userListController
} from "../api/user.api";


export const getMe = [
    passport.authenticate('getMe', {session: false}),
    userInfoController
]

export const userOtp = [
    checkOtpCode
]


export const userRegister = [
    passport.authenticate('signup', {session: false}),
    register
]


export const userLogin = [
    passport.authenticate('login', {session: false}),
    returnAuthInfo
]

export const adminLogin = [
    passport.authenticate('adminLogin', {session: false}),
    returnAuthInfo
]


export const userList = [
    passport.authenticate('isAdmin', {session: false}),
    userListController
]


export const createUser = [
    passport.authenticate('login', {session: false}),
    createUserController
]