
import {Divider} from "@heroui/divider";
import style from "@/styles/chat.module.scss"
import {Button, Card, CardBody, Input, Tab, Tabs} from "@heroui/react";
import ChatCart from "../v2/chat/ChatCart";
import React, {useEffect, useState} from "react";
import MainChatComponents from "@/components/ChatComponents/mainChatComponents";
import {getAuthCookie} from "@/actions/auth.action";
import {errorTO__handle} from "@/config/errorTO__handle";
import {toast} from "react-toastify";


export default function AdminChatComponents() {


    const [pending, setPending] = useState(true)

    useEffect(() => {
        const getToken = async () => {
            const token = await getAuthCookie();
            const server = `${process.env.API_PATH}/api/v1/all-tickets`

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
                // setMsg(data.data)
                // setPending(false)
                // setUser(data.data)

                // console.log(msg)
            })



        }

        const token = getToken().catch(console.error);



    }, []);



    return <div className="w-full bg-default-50 shadow-lg rounded-2xl h-full ">
        <div className="flex h-full w-full max-w-full ">
            <div className={"border-l border-divider basis-1/4"}>
                <div className={"side-bar-head"}>


                    <div>
                        <Tabs aria-label="Options" fullWidth>
                            <Tab key="active" title="فعال">
                                <Card>
                                    <CardBody>

                                        <ChatCart/>
                                        <Divider className="my-4"/>
                                        <ChatCart/>
                                        <Divider className="my-4"/>

                                        <ChatCart/>
                                        <Divider className="my-4"/>

                                        <ChatCart/>
                                        <Divider className="my-4"/>

                                        <ChatCart/>

                                    </CardBody>
                                </Card>
                            </Tab>
                            <Tab key="archive" title="ارشیو">
                                <Card>
                                    <CardBody>
                                        <ChatCart/>
                                        <ChatCart/>
                                        <ChatCart/>
                                        <ChatCart/>
                                        <ChatCart/>
                                        <ChatCart/>
                                    </CardBody>
                                </Card>
                            </Tab>

                        </Tabs>
                    </div>

                </div>

            </div>
            {/*<MainChatComponents />*/}


        </div>


    </div>

}