import { DataTypes } from "sequelize";
import bcrypt from "bcrypt"



export default function(sequelize : any){
   return  sequelize.define('Roles' ,{
        name: {
            type: DataTypes.STRING
        },
        farsi_name: {
            type: DataTypes.STRING
        },
    } , )

}


