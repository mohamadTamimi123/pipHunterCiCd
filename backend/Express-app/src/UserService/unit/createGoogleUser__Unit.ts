import {User} from "../../libs/sequelize/src/db";

export async function createGoogleUser__Unit(email : any){

    await User.create({
      username : email ,

    })



}