// @ts-ignore
import {createUser, getUser} from "../../UserService/unit/passport.units";
import passport from "passport";
import LocalStrategy from "passport-local";
import passportJWT from "passport-jwt"
import 'dotenv/config'
// @ts-ignore
passport.use('signup' ,new LocalStrategy({passReqToCallback : true} , async (req:any , username:any , password:any , done:any)   => {

    try {

        const lUser = await getUser({username: req.body.username})
        if (lUser){
            console.log("hare")
            return done(null, lUser ,{error:true , massage : "user early existed!"});
        }

        const user = await createUser({  username : req.body.username , password : req.body.password })

        if (user){

        }


        console.log(user)
        return done(null, user);
    }catch (e) {


        console.log(e)


        return done(e)
    }

}));

// @ts-ignore
passport.use('login' ,new LocalStrategy({passReqToCallback : true} ,async (req:any , username:any ,password:any ,done:any)  =>  {
    try {

        const error = new Error("invalid")


        if (!username){
            console.log("er")
            return
        }
        const user = await getUser({ username });

        console.log(user)
        if (!user) {

            return error
        }

        const isValidPassword = user.isValidPassword( password );

        if (!isValidPassword){

            return error
        }


        return done(null , user)

    }catch (e) {



        return done(e)
    }

}));

// @ts-ignore
passport.use('adminLogin' ,new LocalStrategy({passReqToCallback : true} ,async (req:any , username:any ,password:any ,done:any)  =>  {
    try {

        const error = new Error("invalid")


        if (!username){
            console.log("er")
            return
        }
        const user = await getUser({ username });

        console.log(user)
        if (!user) {

            return error
        }

        const isValidPassword = user.isValidPassword( password );

        if (!isValidPassword){

            return error
        }


        const userRole = user.isAdmin()

        console.log(userRole.Role)

        return done(null , user)

    }catch (e) {



        return done(e)
    }

}));



passport.use('isAdmin' ,new passportJWT.Strategy({
    // @ts-ignore
    secretOrKey : process.env.JWT_SECRET ,
    jwtFromRequest : passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
    // @ts-ignore
} , (tokenPayload , done)=> {

    try {
        done(null , tokenPayload.user)
    }catch (e) {
        done(e)
    }
}));


passport.use('getMe' ,new passportJWT.Strategy({
    // @ts-ignore
    secretOrKey : process.env.JWT_SECRET ,
    jwtFromRequest : passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
    // @ts-ignore
} , (tokenPayload , done)=> {

    try {
        done(null , tokenPayload.user)
    }catch (e) {
        done(e)
    }
}));










