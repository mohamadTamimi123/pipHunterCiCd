'use client'
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarItem,
} from "@heroui/react";
import React, {useCallback, useEffect, useState} from "react";
import { DarkModeSwitch } from "./darkmodeswitch";
import { useRouter } from "next/navigation";
import {deleteAuthCookie, getAuthCookie} from "@/actions/auth.action";
import {fetch__data} from "@/actions/fetch__handle/example";
import {errorTO__handle} from "@/config/errorTO__handle";
import {toast} from "react-toastify";
import {Spinner} from "@heroui/spinner";

export const UserDropdown = () => {
  const router = useRouter();

  const [user, setUser] = useState()

  const handleLogout = useCallback(async () => {
    await deleteAuthCookie();
    router.replace("/register");
  }, [router]);

  useEffect(() => {
    const getToken = async () => {
     const token = await getAuthCookie();
      const server = `${process.env.API_PATH}/api/v1/auth/get-me`

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
          handleLogout()
        }
      }).then(data => {
        console.log(data)
        setUser(data.data)

      })



    }

    const token = getToken().catch(console.error);



  }, []);


  return (
      <>
        {
          user ? <Dropdown>
            <NavbarItem>
              <DropdownTrigger>
                <Avatar
                    as='button'
                    color='secondary'
                    size='md'
                    // src='https://i.pravatar.cc/150?u=a042581f4e29026704d'
                />
              </DropdownTrigger>
            </NavbarItem>
            <DropdownMenu
                aria-label='User menu actions'
                onAction={(actionKey) => console.log({ actionKey })}>
              <DropdownItem
                  key='profile'
                  className='flex flex-col justify-start w-full items-start'>
                <p>به عنوان وارد شدید</p>
                <p>{
                  // @ts-ignore
                  user?.username}</p>
              </DropdownItem>
              <DropdownItem key='settings'>تنظیمات</DropdownItem>

              <DropdownItem
                  key='logout'
                  color='danger'
                  className='text-danger'
                  onPress={handleLogout}>
                خروج از حساب
              </DropdownItem>
              <DropdownItem key='switch'>
                <DarkModeSwitch />
              </DropdownItem>
            </DropdownMenu>
          </Dropdown> : <Spinner />
        }


      </>

  );
};
