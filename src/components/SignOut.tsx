"use client"
import { signOut } from "next-auth/react"
import { Button } from "./ui/button"
 
export default function SignOutBtn() {
  return <Button className="rounded-none bg-red-600 hover:bg-red-700" onClick={() => signOut()}>Sign Out</Button>
}