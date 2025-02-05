import { jwtDecode } from "jwt-decode";
import {createGoogleUser__Unit} from "../unit/createGoogleUser__Unit";
import {createUser, getUser} from "../unit/passport.units";
import {emailQueue} from "../../emailService/units/sendRegisterEmailForAdmins__Unit";
import {User} from "../../libs/sequelize/src/db";
import jwt from "jsonwebtoken";
var generator = require('generate-password');

export async function getCredentController(req :any , res : any){
    try {
        const decoded = jwtDecode(req.body.cred);
        // @ts-ignore
        const lUser = await getUser({username: decoded.email})
        if (lUser){
            console.log("hare")
            return  res.status(403).json("")
        }



        var password = generator.generate({
            length: 10,
            numbers: true
        });


        // @ts-ignore
        const user = await createUser({  username : decoded.email , password : password })
        // @ts-ignore


        const emal = decoded.email
        const emalId = user.id

        const payload = {
            user : {emalId , emal}
        }
        const token = jwt.sign(payload,String(process.env.JWT_SECRET) )


        await emailQueue.add({});


        res.status(200).json({
            success : true ,data : token
        })




        // #todo email to admin


        // sendRegisterEmailForAdmins__Unit(`new register :${emal}`)
    }catch (e) {

        console.log(e)
    }

}

