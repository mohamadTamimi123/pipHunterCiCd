import { Sequelize } from "sequelize";
import userModel from "../../../UserService/model/user.model";

import User_roleModel from "../../../UserService/model/user_role.model";
import RoleModel from "../../../UserService/model/role.model";
import ticketModel from "../../../TicketService/model/ticket.model";
import Ticket_userModel from "../../../TicketService/model/ticket_user.model";

const sequelize = new Sequelize('citizix_db' ,'citizix_user' , "S3cret" ,{
  host: process.env.POSTGRES_HOST,
  dialect: 'postgres'/* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
});

const User = userModel(sequelize)
const Role = RoleModel(sequelize)
const User_Roll = User_roleModel(sequelize)


const Ticket = ticketModel(sequelize)

const Ticket_User = Ticket_userModel(sequelize)

export { sequelize }
export { User }
export { Role }
export { User_Roll }
export {Ticket}
export {Ticket_User}


