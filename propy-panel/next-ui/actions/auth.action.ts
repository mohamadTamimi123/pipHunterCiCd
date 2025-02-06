"use server";

import { cookies } from "next/headers";

export const createAuthCookie = async (token : any) => {
  cookies().set("userAuth", token, { secure: true });
};




export const deleteAuthCookie = async () => {
  cookies().delete("userAuth");
};



export const getAuthCookie =  async() => {
   return cookies().get("userAuth")?.value;
};
