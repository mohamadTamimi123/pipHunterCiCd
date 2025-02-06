
import {Divider} from "@heroui/divider";
import style from "@/styles/chat.module.scss"
import {Button, Card, CardBody, Input, Tab, Tabs} from "@heroui/react";
import ChatCart from "../v2/chat/ChatCart";
import React, {useEffect, useState} from "react";
import MainChatComponents from "@/components/ChatComponents/mainChatComponents";


export default function ChatComponents() {


    const [pending, setPending] = useState(true)




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
            <MainChatComponents />


        </div>


    </div>

}