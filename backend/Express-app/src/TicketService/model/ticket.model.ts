// title: { type: String, required: true },
// description: { type: String, required: true },
// status: { type: String, default: 'open' }, // وضعیت تیکت (open, in progress, closed)
// user: { type: String, required: true }, // نام کاربر یا شناسه کاربر
// createdAt: { type: Date, default: Date.now }



import { DataTypes } from "sequelize";
import bcrypt from "bcrypt"



export default function(sequelize : any){
    return  sequelize.define('Tickets' ,{
        title: {
            type: DataTypes.STRING ,
            required : true
        },
        description: {
            type: DataTypes.STRING ,
            required : true
        },
        status: {
            type: DataTypes.STRING ,
            default : "open"
        },
        user: {
            type: DataTypes.STRING ,
            required : true
        },
    } , )

}


