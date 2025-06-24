"use client"
import { signOut } from "next-auth/react"
import { Button } from "./ui/button"
import { FaSignOutAlt } from "react-icons/fa"
 
export default function SignOutBtn() {
  return <Button className="bg-transparent text-zinc-950 dark:text-zinc-50 hover:bg-transparent hover:text-red-600 cursor-pointer" onClick={() => signOut()}><FaSignOutAlt /></Button>
}