import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader, Textarea,
    useDisclosure,
} from "@heroui/react";
import React, {useEffect, useState} from "react";
import {getAuthCookie} from "@/actions/auth.action";
import {errorTO__handle} from "@/config/errorTO__handle";
import {toast} from "react-toastify";

export const AddTicket = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [pending, setPending] = useState(false)
    function handleSubmit(e : any){
        setPending(true)
        const token = getToken().catch(console.error);


    }


        const getToken = async () => {
            const token = await getAuthCookie();
            const server = `${process.env.API_PATH}/api/v1/tickets`

            fetch(server, {
                method: "post",
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
                // setUser(data.data)

            })



        }






    return (
        <div>
            <>
                <Button onPress={onOpen} color="primary">
                    تیکت جدید
                </Button>
                <Modal
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    placement="top-center"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    تیکت جدید
                                </ModalHeader>
                                <ModalBody>
                                    <Input label="عنوان" variant="bordered" />
                                    <Textarea />

                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="flat" onClick={onClose}>
                                        Close
                                    </Button>
                                    <Button color="primary" onPress={(e) => handleSubmit(e)}>
                                        ثیت
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </>
        </div>
    );
};
