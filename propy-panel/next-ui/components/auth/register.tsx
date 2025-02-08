"use client";

import {createAuthCookie} from "@/actions/auth.action";
import {RegisterSchema} from "@/helpers/schemas";
import {RegisterFormType} from "@/helpers/types";
import {Button, Input} from "@heroui/react";
import {Formik} from "formik";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useState} from "react";
import GoogleButton from "react-google-button";
import {GoogleLogin, useGoogleLogin} from "@react-oauth/google";
import {Divider} from "@heroui/divider";
import {LineMdEmailPlusTwotone} from "@/components/v2/icons/EmailIcon";
import {Icon} from "@iconify/react";
import {jwtDecode} from "jwt-decode";
import {RowSteps} from "@/components/v2/RowStep/RowStep";
import {InputOtp} from "@heroui/input-otp";
import {toast} from "react-toastify";
import FadeIn from "react-fade-in";
import {BackIcon} from "@/components/v2/icons/BackIcon";


export const Register = () => {
    const router = useRouter();

    const initialValues: RegisterFormType = {
        name: "Acme",
        email: "admin@acme.com",
        password: "admin",
        confirmPassword: "admin",
    };
    const [value, setValue] = useState("");
    const [inLoad, setInLoad] = useState(false)

    const [uid, setUid] = useState()

    const [inDevelop, setInDevelop] = useState(0)

    const handleRegister = useCallback(
        async (values: RegisterFormType) => {
            // `values` contains name, email & password. You can use provider to register user
            //   setInDevelop(2)
            setInLoad(true)




            const data = {
                username: values.email,
                password: values.password
            }
            fetch(`${process.env.API_PATH}/api/v1/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data)
                }
            ).then(res => {
                setInLoad(false)
                if (res.status === 403) {
                    toast.error("با این ایمیل قبلا ثبت نام شده !")

                }

                return res.json()

            }).then(data => {

                if (data.success) {
                    setInDevelop(2)
                    setUid(data.data.uid)

                }

                console.log(data)
                // setInDevelop(2)
                // createAuthCookie(data.data);
                // router.replace("/");


            })


        },
        []
    );


    // @ts-ignore
    const login = useGoogleLogin({
        onSuccess: credentialResponse => {
            console.log(credentialResponse);
            console.log(jwtDecode(credentialResponse.access_token))
        },
        auto_select: true
    });


    function checkOtp() {
        console.log("start")
        setInLoad(true)
        fetch(`${process.env.API_PATH}/api/v1/auth/otp` ,{
            method : "POST" ,
            headers : {
                "Content-Type": "application/json",
            },
            body : JSON.stringify({uid : uid , code : value })
        }).then(res => res.json()).then(data => {

            createAuthCookie(data.data);
            router.replace("/");
        })
        // setValue()
    }





    function signUpGoogle(b : any){


        alert("satart")

        fetch(`${process.env.API_PATH}/api/v1/auth-google/google` ,{
            method : "POST" ,
            headers : {
                "Content-Type": "application/json",
            },
            body : JSON.stringify({cred : b})
        })
            .then(res => {
                console.log(res)
                setInLoad(false)
                if (res.status === 403) {
                    toast.error("با این ایمیل قبلا ثبت نام شده !")

                }
                return res.json()

            })
            .then(data => {
                createAuthCookie(data.data);
                router.replace("/");
            })

    }

    return (
        <>
            <FadeIn>
                <div className='relative text-center text-[25px] font-bold mb-12'>
                    <h1>
                        ثـبـتـــ نـام
                    </h1>
                </div>
            </FadeIn>

            <>
                {inDevelop === 0 &&
                    <FadeIn className={"w-80"}>
                        <GoogleLogin
                            onSuccess={credentialResponse => {
                                // console.log(credentialResponse);
                                // @ts-ignore

                                signUpGoogle(credentialResponse.credential)
                                // console.log(jwtDecode(credentialResponse.credential));
                            }}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                        />


                        <div className="flex items-center gap-4 py-2 mt-4 mb-4">
                            <Divider className="flex-1"/>
                            <p className="shrink-0 text-tiny text-default-500">یـا</p>
                            <Divider className="flex-1"/>
                        </div>


                        <Button
                            variant={"bordered"}
                            startContent={< LineMdEmailPlusTwotone/>}
                            onClick={() => setInDevelop(1)}
                            className={"w-full"} color={"primary"}>
                            با ایمیل
                        </Button>
                    </FadeIn>

                }
            </>
            <>
                {
                    inDevelop === 1 &&
                    <FadeIn className={"w-96"}>

                        <Formik
                            initialValues={initialValues}
                            validationSchema={RegisterSchema}
                            onSubmit={handleRegister}>
                            {({values, errors, touched, handleChange, handleSubmit}) => (
                                <>
                                    <div className='flex flex-col w-1/2 gap-4 mb-4 w-full'>

                                        <Input
                                            variant='bordered'
                                            label='ایـمـیـل'
                                            type='email'
                                            value={values.email}
                                            isInvalid={!!errors.email && !!touched.email}
                                            errorMessage={errors.email}
                                            onChange={handleChange("email")}
                                        />
                                        <Input
                                            variant='bordered'
                                            label='گـذرواژه'
                                            type='password'
                                            value={values.password}
                                            isInvalid={!!errors.password && !!touched.password}
                                            errorMessage={errors.password}
                                            onChange={handleChange("password")}
                                        />
                                        <Input
                                            variant='bordered'
                                            label='تـکـرار رمـز عـبـور'
                                            type='password'
                                            value={values.confirmPassword}
                                            isInvalid={
                                                !!errors.confirmPassword && !!touched.confirmPassword
                                            }
                                            errorMessage={errors.confirmPassword}
                                            onChange={handleChange("confirmPassword")}
                                        />
                                    </div>

                                    <Button
                                        className={"w-full mt-4"}
                                        isLoading={inLoad}
                                        onPress={() => handleSubmit()}
                                        variant='flat'
                                        color='primary'
                                        startContent={< LineMdEmailPlusTwotone/>}
                                    >
                                        ثـبـتـ نـام
                                    </Button>


                                    <div className="flex items-center gap-4 py-2 mt-4 mb-4">
                                        <Divider className="flex-1"/>
                                        <p className="shrink-0 text-tiny text-default-500">یـا</p>
                                        <Divider className="flex-1"/>
                                    </div>
                                   <Button

                                       onClick={()=>setInDevelop(0)} startContent={<Icon icon="line-md:arrow-small-right" width="24" height="24" />} className={"w-full"} variant={"bordered"}>

                                       بازگشت
                                   </Button>
                                </>
                            )}
                        </Formik>


                    </FadeIn>
                }


            </>
            <>
                {
                    inDevelop === 2 &&
                    <FadeIn className={"w-96 "}>

                        <div className={"justify-center ltr flex"}>
                            <InputOtp length={4} value={value} onValueChange={setValue}/>
                        </div>

                        <Button
                            className={"w-full mt-4"}
                            startContent={< LineMdEmailPlusTwotone/>}
                            isLoading={inLoad}
                            variant='flat'
                            color='primary'
                            onPress={() => checkOtp()}
                        >
                            ثـبـتـ نـام
                        </Button>
                        <div className="flex items-center gap-4 py-2 mt-4 mb-4">
                            <Divider className="flex-1"/>
                            <p className="shrink-0 text-tiny text-default-500">یـا</p>
                            <Divider className="flex-1"/>
                        </div>
                        <Button

                            onClick={() => setInDevelop(0)}
                            startContent={<Icon icon="line-md:arrow-small-right" width="24" height="24"/>}
                            className={"w-full"} variant={"bordered"}>

                            بازگشت
                        </Button>
                    </FadeIn>
                }


            </>

            <div className='absolute font-light bottom-10 text-slate-400 mt-4 text-sm'>
                از قبل اکانت دارید؟{" "}
                <Link href='/login' className='font-bold'>
                    ورود
                </Link>
            </div>
        </>
    )
};
