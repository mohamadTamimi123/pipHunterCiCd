import {errorTO__handle} from "@/config/errorTO__handle";
import {toast} from "react-toastify";

export const fetch__data = (url : string , token:string) => {
    const server = `${process.env.API_PATH}/api/v1/${url}`

    fetch(server, {
           method: "GET",
           headers: {
               "content-type": "Application/json",
               Authorization:`bearer ${token}`
            },

            }).then(res => {

            if (res.ok) {
                return res.json()
        } else {
            const errorMassage = errorTO__handle(res)

            toast.error(errorMassage)
        }
        }).then(data => {
            console.log(data)

        })






}