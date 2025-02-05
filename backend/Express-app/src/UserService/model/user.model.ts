import { DataTypes } from "sequelize";
import bcrypt from "bcrypt"

async function hashPassword(user:any){
  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(user.password , salt)
}


export default function(sequelize : any){
  const User =  sequelize.define('Users' ,{
    username: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
  } , {
    hooks : {beforeCreate :hashPassword ,beforeUpdate :hashPassword} ,

  })

  User.prototype.isValidPassword = function (password:any){
    return bcrypt.compareSync(password , this.password)
  }

  User.prototype.isAdmin = function (){
    return this
  }

  return User
}


