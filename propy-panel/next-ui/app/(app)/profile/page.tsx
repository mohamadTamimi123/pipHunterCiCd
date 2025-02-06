"use client";
import React, {useCallback} from "react";
import {Button, Input} from "@heroui/react";
import {Formik} from "formik";
import {LoginSchema} from "@/helpers/schemas";

import {LoginFormType} from "@/helpers/types";
import {useRouter} from "next/navigation";


export default function Profile() {

    const router = useRouter();

    const initialValues: LoginFormType = {
        email: "admin@acme.com",
        password: "admin",
    };

    const handleLogin = useCallback(
        async (values: LoginFormType) => {
            // `values` contains email & password. You can use provider to connect user

            // await createAuthCookie();
            // router.replace("/");
        },
        [router]
    );

    return <div className="h-full lg:px-6">
        <div
            className="flex justify-center gap-4 xl:gap-6 pt-3 px-4 lg:px-0  flex-wrap xl:flex-nowrap sm:pt-10 max-w-[90rem] mx-auto w-full">
            <div className="mt-6 gap-6 flex flex-col w-full">

                <div className="h-full flex flex-col gap-2">
                    <h3 className="text-xl font-semibold">اطلاعات پروفایل</h3>
                    <div className="w-full bg-default-50 shadow-lg rounded-2xl p-6 ">

                        <Formik
                            initialValues={initialValues}
                            validationSchema={LoginSchema}
                            onSubmit={handleLogin}>
                            {({ values, errors, touched, handleChange, handleSubmit }) => (
                                <>
                                    <div className='flex flex-col w-1/2 gap-4 mb-4'>
                                        <Input
                                            variant='bordered'
                                            label='ایمیل'
                                            type='email'
                                            value={values.email}
                                            isInvalid={!!errors.email && !!touched.email}
                                            errorMessage={errors.email}
                                            onChange={handleChange("email")}
                                        />
                                        <Input
                                            variant='bordered'
                                            label='رمز عبور'
                                            type='password'
                                            value={values.password}
                                            isInvalid={!!errors.password && !!touched.password}
                                            errorMessage={errors.password}
                                            onChange={handleChange("password")}
                                        />
                                    </div>

                                    <Button
                                        onPress={() => handleSubmit()}
                                        variant='flat'
                                        isDisabled={true}
                                        color='primary'>
                                        ذخیره
                                    </Button>
                                </>
                            )}
                        </Formik>


                    </div>
                </div>


            </div>
        </div>
    </div>
                }