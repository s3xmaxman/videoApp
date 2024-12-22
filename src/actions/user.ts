"use server";
import { currentUser } from "@clerk/nextjs/server";

export const unAuthenticateUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 403 };
    }
  } catch (error) {
    console.log(error);
    return { status: 500 };
  }
};
