
import style from "@/styles/chat.module.scss";
import {Button, Input} from "@heroui/react";
import React, {useEffect, useState} from "react";
import {getAuthCookie} from "@/actions/auth.action";
import {errorTO__handle} from "@/config/errorTO__handle";
import {toast} from "react-toastify";
import {Spinner} from "@heroui/spinner";

export default function MainChatComponents() {

    const [msg, setMsg] = useState()
    const [pending, setPending] = useState(true)
    useEffect(() => {
        const getToken = async () => {
            const token = await getAuthCookie();
            const server = `${process.env.API_PATH}/api/v1/tickets/user-ticket`

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
                setMsg(data.data)
                setPending(false)
                // setUser(data.data)

                console.log(msg)
            })



        }

        const token = getToken().catch(console.error);



    }, []);




    return <div className={"flex flex-col w-full"}>
        <div className={"h-16 border-b border-divider"}>header</div>
        <div className={`flex flex-col gap-6 ${style.main_pos} flex-grow mt-6 px-6`}>

            {
                pending ? <Spinner /> :

                    // @ts-ignore
                    msg.map((item) => {
                        return <div className={""}>

                            {item.description}



                            <div>

                                <div>
                                    time
                                </div>

                                <div>
                                    seen
                                </div>

                            </div>

                        </div>
                    })
            }
        </div>
        <div className={"flex"}>
            <Input className={"flex-grow"} radius={"none"}/>
            <Button radius={"none"}>
                ارسال
            </Button>
        </div>
    </div>

}