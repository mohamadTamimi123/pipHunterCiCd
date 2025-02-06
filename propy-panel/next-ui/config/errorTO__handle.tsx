import {deleteAuthCookie} from "@/actions/auth.action";


export const  errorTO__handle = (res : any) => {
    console.log(res)
    switch (res.status){
        case 404 :
            return `${res.statusText}   :::: errorCode : ${res.status}`
         break;

        case 400 :
            return `${res.statusText}   :::: errorCode : ${res.status}`

            break;


        case 401 :
            return `${res.statusText}   :::: errorCode : ${res.status}`
            break;
        default :

            console.log(res.statusText)
            return res.statusText
    }
}