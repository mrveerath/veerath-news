"use client"
import { signIn } from "next-auth/react"
import { Button } from "./ui/button"
 
export default function SignInBtn() {
  return <Button className="rounded-none bg-red-600 hover:bg-red-700" onClick={() => signIn()}>Sign In</Button>
}