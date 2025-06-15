"use client"
import { createContext } from "react";
import { SessionProvider } from "next-auth/react";

export default function AuthenticationProvider ({children}:{children:React.ReactElement}){
    return(
        <SessionProvider >
            {children}
        </SessionProvider>
    )
}
