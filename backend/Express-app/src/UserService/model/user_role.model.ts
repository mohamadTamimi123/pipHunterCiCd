import { DataTypes } from "sequelize";
import {Role, User} from "../../libs/sequelize/src/db";




export default function(sequelize : any){
    const User_Role = sequelize.define(
        'User_Role',
        {
            selfGranted: DataTypes.BOOLEAN,
        },
        { timestamps: false },
    );


    User.belongsToMany(Role, { through: User_Role });
    Role.belongsToMany(User, { through: User_Role });

    return User_Role
}


