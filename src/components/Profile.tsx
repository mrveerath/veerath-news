import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Profile(): React.ReactElement {
    const { data } = useSession()
    console.log(data)
    return (
        <Link className=" flex items-center justify-center text-zinc-950 dark:text-zinc-50 " href={"/profile"}>
            {data?.user.image ? (
                <Image width={100} height={100} className="h-8 w-8 rounded-full object-center" src={data?.user.image || ""} alt="" />
            ) : (
                <User size={18} />
            )}
        </Link>
    )
}