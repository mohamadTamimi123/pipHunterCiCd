import { DataTypes } from "sequelize";
import {Ticket, User} from "../../libs/sequelize/src/db";





export default function(sequelize : any){
    const Ticket_User = sequelize.define(
        'Ticket_User',
        {
            selfGranted: DataTypes.BOOLEAN,
        },
        { timestamps: false },
    );


    User.belongsToMany(Ticket, { through: Ticket_User });
    Ticket.belongsToMany(User, { through: Ticket_User });

    return Ticket_User
}


