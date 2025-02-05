import accessControl from "../libs/accesscontrol/accesscontrol"

export function createUserMiddleware (req:any, res:any, next:any) {
    try {
        const { id: userId } = req.params;
        const { role: userRole } = req.user || "none";

        const permission = accessControl.can(userRole).read('profile');

        if (permission.granted) {
            res.send(`User profile: ${userId}`);
        } else {
            res.status(403).send('Forbidden');
        }
        next()
    }catch (e){
        res.status(403).send('Forbidden');
    }

}



export function getUserListMiddleWare(req :any , res:any ,next:any){
    next()
}