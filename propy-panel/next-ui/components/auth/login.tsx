"use client";

import { createAuthCookie } from "@/actions/auth.action";
import { LoginSchema } from "@/helpers/schemas";
import { LoginFormType } from "@/helpers/types";
import { Button, Input } from "@heroui/react";
import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {useCallback, useState} from "react";
import {toast} from "react-toastify";
import {errorTO__handle} from "@/config/errorTO__handle";


export const Login = () => {
  const router = useRouter();
    const [pend, setPend] = useState(false)

  const initialValues: LoginFormType = {
    email: "admin@acme.com",
    password: "admin",
  };

  const handleLogin = useCallback(
    async (values: LoginFormType) => {
      // `values` contains email & password. You can use provider to connect user

        const newData = {
            username : values.email ,
            password:  values.password
        }

        setPend(true)





      fetch(`${process.env.API_PATH}/api/v1/auth/login` , {
          method : "POST" ,
          headers : {
            "content-type" : "Application/json"
          } ,
          body : JSON.stringify(newData)
      }).then(res => {
          setPend(false)
          if (res.ok){

              return res.json()
          }else {
            const error = errorTO__handle(res)
              toast.error(error)
          }



      })
          .then(data => {
              if (data?.success){

                  createAuthCookie(data.data);
                  router.replace("/");
              }else {
                  // toast.error("خطایی رخ داده!")
                  // return
              }
          })
    },
          [router]
  );

  return (
    <>
      <div className='text-center text-[25px] font-bold mb-6'>ورود</div>

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
              isLoading={pend}
              variant='flat'
              color='primary'>
              ورود
            </Button>
          </>
        )}
      </Formik>

      <div className='font-light text-slate-400 mt-4 text-sm'>
        حساب کاربری ندارید ؟{" "}
        <Link href='/register' className='font-bold'>
          ثبت نام
        </Link>
      </div>
    </>
  );
};
