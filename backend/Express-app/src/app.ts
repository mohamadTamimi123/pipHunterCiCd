import express, { Request, Response } from 'express';
import { userRoute } from "./UserService/route/user.route";
import cors from "cors";
import bodyParser from "body-parser";
import passport from 'passport';
import {ticketRoute} from "./TicketService/route/ticket.route";
import {googleRoute} from "./UserService/route/google.route";

import Queue from 'bull';
const emailQueue = new Queue('emailQueue');




const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(express.json());

app.use(bodyParser.urlencoded())

// parse application/json
app.use(bodyParser.json())

app.use(passport.initialize());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello from setup file');
});


app.use('/api/v1' , userRoute)
app.use('/api/v1' , ticketRoute)
app.use('/api/v1' , googleRoute)

export default app;