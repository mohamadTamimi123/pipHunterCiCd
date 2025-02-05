

import passport from "passport";
import express, { Request, Response, NextFunction } from 'express';
import {getGoogleCredent} from "../api/google.api";




const googleRoute = express.Router();

// Authentication routes
googleRoute.post('/auth-google/google',  getGoogleCredent);


export {googleRoute}
