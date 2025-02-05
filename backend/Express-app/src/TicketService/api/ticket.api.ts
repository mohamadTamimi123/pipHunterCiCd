import {CreateNewTicket__unit, GetAllTicket__unit, GetUserTicket__unit} from "../unit/ticket.units";
import {Ticket} from "../../libs/sequelize/src/db";


export async function createNewTicket(req : any , res : any){


    if (! req.user) {
        res.status(401);
    }



    const { title, description } = req.body;


    if (!title || !description ) {
        // return res.status(400).json({ error: 'Title, description, and user are required' });
    }

        const newTicket = await CreateNewTicket__unit( "sad", "sadsadasd", 3 );

        res.status(201).json(newTicket);






}

export async function getTicketList(req : any , res : any){

     const userId = req.user.id


    const tickets =  await Ticket.findAll({where:{user : userId}})


    res.status(200).json({success : true  , data : tickets })

}

export async function sendUserTicket(req: any , res : any){
    const userId : string = req.user.id


    const newTicket = await GetUserTicket__unit(`${userId}`)

    res.status(200).json({success : true  , data : newTicket })
}


export async function sendAllTicket(req:any , res:any   ){

    const allTicket = await GetAllTicket__unit()

    res.status(200).json({success : true  , data : allTicket })

}