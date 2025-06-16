import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

export default function Profile(): React.ReactElement {
    const { data } = useSession()
    return (
        <Link className=" flex items-center justify-center text-zinc-950 dark:text-zinc-50 " href={"/profile"}>
            {data?.user.image || <User size={18} />}
        </Link>
    )
}