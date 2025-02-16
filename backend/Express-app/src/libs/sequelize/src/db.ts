import { Sequelize } from "sequelize";
import userModel from "../../../UserService/model/user.model";

import User_roleModel from "../../../UserService/model/user_role.model";
import RoleModel from "../../../UserService/model/role.model";
import ticketModel from "../../../TicketService/model/ticket.model";
import Ticket_userModel from "../../../TicketService/model/ticket_user.model";
import 'dotenv/config'

const sequelize = new Sequelize(
    // @ts-ignore
    process.env.POSTGRES_DB,      // نام دیتابیس
    process.env.POSTGRES_USER,    // نام کاربری
    process.env.POSTGRES_PASSWORD, // رمز عبور
    {
      host: process.env.POSTGRES_HOST, // میزبان دیتابیس
      dialect: 'postgres', // نوع دیتابیس
      pool: { // تنظیمات pool برای بهینه‌سازی اتصال‌ها
        max: 5,  // حداکثر تعداد اتصالات
        min: 0,  // حداقل تعداد اتصالات
        acquire: 30000, // حداکثر زمان قبل از خطای Timeout در میلی‌ثانیه
        idle: 10000     // مدت زمان بیکاری قبل از قطع اتصال
      },
      retry: { // تنظیم تلاش مجدد هنگام خطا در اتصال
        max: 3 // تعداد دفعات تلاش مجدد
      }
    }
);

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


