// app/actions/authActions.js
"use server";

import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/user.model";

interface Response {
  error:string
  success:boolean
}

export async function registerUser(formData: FormData): Promise<Response> {
  try {
    await dbConnect();

    const { userName, email, password, fullName } = Object.fromEntries(formData);

    // Validate form data
    if (!userName || !email || !password || !fullName) {
     return { error: "All The fields Are Required", success: false } as Response;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return { error: "User Already Exist", success: false } as Response;
    }

    // Create new user
    const newUser = new User({
      userName,
      email,
      password,
      fullName,
    });

    await newUser.save();
    return { error: "", success: true } as Response
  } catch (error) {
    console.log(error)
    console.error("Registration error:", error);
    // Handle error (e.g., show an error message to the user)
    return { error: "Failed To Register User", success: false } as Response;
  }
}
