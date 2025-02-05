import passport from "passport";

import {createNewTicket, getTicketList, sendAllTicket, sendUserTicket} from "../api/ticket.api";

export const newTicket = [
    passport.authenticate("getMe") ,
    createNewTicket
]




export const getTicket = [
    passport.authenticate("getMe") ,
    getTicketList
]


export const getUserTicket = [
    passport.authenticate("getMe" , {session: false}) ,
    sendUserTicket
]


export const getAllTicket = [
    passport.authenticate("isAdmin" , {session: false}) ,
    sendAllTicket
]


