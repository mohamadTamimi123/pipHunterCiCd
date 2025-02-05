import jwt from "jsonwebtoken"

import {getUser, getUserList__unit} from "../unit/passport.units";

import {User} from "../../libs/sequelize/src/db";

import {createOtpRedis__Unit} from "../../libs/redis/units/createOtpRedis__Unit";
import {getOtpRedis__Unit} from "../../libs/redis/units/getOtpRedis__Unit";
import {sendOtpLogin__Unit} from "../../emailService/units/sendOtpLogin__Unit";
import {emailQueue} from "../../emailService/units/sendRegisterEmailForAdmins__Unit";


export async function checkOtpCode(req:any , res : any){
  const uid = req.body.uid
  const otp = req.body.code

  const id = uid.split("_")
  const code = await getOtpRedis__Unit(uid)
  // const code = 123
  console.log("**************")
  console.log(code)
  console.log("**************")

  if (code === otp){
    const {username} = await User.findOne({where : {id : id[1]}})
    const payload = {
      user : {id , username}
    }
    const token = jwt.sign(payload,String(process.env.JWT_SECRET) )


    res.status(200).json({
      success : true ,data : token
    })




    // #todo email to admin
    emailQueue.add({
      to: "admins@phphunter",
      subject: "new user register",
      text: `new register :${username}`
    });



  }
}


export async function register(req:any , res : any){

  try {
    console.log(req.authInfo)
    if (req.authInfo?.error){
      return res.status(403).send("user early existed!")

    }

    var val = Math.floor(1000 + Math.random() * 9000);



    createOtpRedis__Unit(req.user.id , String(val))




    // sendOtpLogin__Unit(val , req.user.username)

    emailQueue.add({
      to: req.user.username,
      subject: "otp",
      text: val
    });








    res.status(200).json({
      success : true , data : {uid : `U_${req.user.id}`}
    })
  }catch (e){
    console.log(e)
  }

}



export async function returnAuthInfo(req:any , res:any){

  const user =  await  User.findOne({where : { username  : req.body.username}})


  if (!user){
    res.status(401).send("unauthorized")
    return
  }

  const {id, username} = user
  const payload = {
    user : {id , username}
  }
  const token = jwt.sign(payload,String(process.env.JWT_SECRET) )


  res.status(200).json({
    success : true ,data : token
  })

}


export async function userListController(req : any , res:any){

  const users = await getUserList__unit()


  return res.status(200).json({
    success: true ,
    data : users
  })


}




export async function createUserController(req:any , res:any){}


export  function userInfoController(req:any , res :any){

  return res.status(200).json({
    success: true ,
    data : req.user
  })
}