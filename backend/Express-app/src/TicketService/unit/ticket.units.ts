
import sendmail from "../../emailService/email";
import {Ticket, User} from "../../libs/sequelize/src/db";

export async function CreateNewTicket__unit( title: string, description :string, user : number ){
    sendmail()
   return  await Ticket.create({
        title : title,
        description : description ,
        status : "open" ,
        user : user


    })
}




export async function GetUserTicket__unit(userId : string){
    return await Ticket.findAll({where : {user : userId}})
}


export async function GetAllTicket__unit(){
    return await Ticket.findAll({include : User})
}