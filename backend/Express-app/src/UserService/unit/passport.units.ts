import {Role, User} from "../../libs/sequelize/src/db";
import {SendDeveloperEmail__Unit} from "../../emailService/units/SendDeveloperEmail__Unit";


export async function createUser({ username ,password  } :{  username : string , password : string }){

  try {


    return await User.create({

      username : username ,
      password : password ,
      email: username
    })
  }catch (e) {


    SendDeveloperEmail__Unit(e)
    console.log(e)



  }


}



export async function getUser({username } : {username :string}){


    return  await  User.findOne({where : { username  } , include: Role })


}


export function returnAuthInfo(){

}


export async function getUserList__unit(){
  return await User.findAll()
}

export async function getUser__unit(){

}