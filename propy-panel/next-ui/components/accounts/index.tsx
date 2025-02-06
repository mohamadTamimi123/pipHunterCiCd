"use client";
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import React, {useState} from "react";
import { DotsIcon } from "@/components/icons/accounts/dots-icon";
import { ExportIcon } from "@/components/icons/accounts/export-icon";
import { InfoIcon } from "@/components/icons/accounts/info-icon";
import { TrashIcon } from "@/components/icons/accounts/trash-icon";
import { HouseIcon } from "@/components/icons/breadcrumb/house-icon";
import { UsersIcon } from "@/components/icons/breadcrumb/users-icon";
import { SettingsIcon } from "@/components/icons/sidebar/settings-icon";
import { TableWrapper } from "@/components/table/table";
import { AddUser } from "./add-user";

export const Accounts = () => {



    function handleSubmit(){
        const requestData = {
            balance: 1000,
            group: "demo\\test group for mtm test",
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
            level: "level1"
        };


        console.log("start")

        fetch(`http://91.107.173.17:5000/account/create_account/` , {
            method : "POST" ,
            headers : {
                'Content-Type': 'application/json'
            } ,
            body : JSON.stringify(requestData)
                // "Doe", "email":"john.doe@example.com", "level": "level1"})

        }).then(res => res.json()).then(data => {
            console.log("response")
            console.log(data)
        })
    }


    function getData__handle(){
        fetch(`http://91.107.173.17:5000/account/get_account_info/` , {
            method : "POST" ,
            headers : {
                'Content-Type': 'application/json'
            } ,
            body : JSON.stringify({login:2663206, password: "@MYkhX9kg"})
            // "Doe", "email":"john.doe@example.com", "level": "level1"})

        }).then(res => res.json()).then(data => {
            console.log("response")
            console.log(data)
        })
    }


  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <ul className="flex">
        <li className="flex gap-2">
          <HouseIcon />
          <Link href={"/"}>
            <span>Home</span>
          </Link>
          <span> / </span>{" "}
        </li>

        <li className="flex gap-2">
          <UsersIcon />
          <span>Users</span>
          <span> / </span>{" "}
        </li>
        <li className="flex gap-2">
          <span>List</span>
        </li>
      </ul>

      <h3 className="text-xl font-semibold">All Accounts</h3>
      <div className="flex justify-between flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">

        </div>
        <div className="flex flex-row gap-3.5 flex-wrap">

        </div>
      </div>
      <div className="max-w-[95rem] mx-auto w-full">


          <Button onPress={() => handleSubmit()}>
              اجاد api
          </Button>





          <Button onPress={() => getData__handle()}>
              get deta
          </Button>
      </div>
    </div>
  );
};
