"use client"
import { Button } from "@/components/ui/button";
import Imagepkr from "@/components/UploadAssetForm";
import { cn } from "@/lib/utils";
import { Upload, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useState } from "react";

export default function page(): React.ReactElement {
    const { data } = useSession()
    const [showImageUploadForm, setShowImageUploadForm] = useState<boolean>(false)
    const [imagesToUpload, setImagesToUPload] = useState<File[]>([])
    const handleUploadAssets = useCallback(() => {},[])
    return (
        <div className={cn(
            "grid grid-cols-4 min-h-screen gap-10 p-18 w-full bg-zinc-200 dark:bg-zinc-800"
        )}>
            {
                showImageUploadForm && (
                    <div className="bg-zinc-600/50 h-screen w-screen fixed top-0 left-0 flex items-center justify-center">
                        <div className="min-w-3xl bg-zinc-50 p-4">
                        <Button onClick={() => setShowImageUploadForm(false)} variant={"destructive"} className="bg-zinc-50 dark:bg-zinc-950 text-red-600 rounded-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900">X</Button>
                            <Imagepkr images={imagesToUpload} setImages={setImagesToUPload} />
                            <Button onClick={handleUploadAssets} className="w-full bg-red-600 text-zinc-50 dark:text-zinc-950 mt-5 rounded-none">Upload <Upload /></Button>
                        </div>
                    </div>
                )
            }
            <section className="col-span-1 bg-zinc-50 h-screen">
                <div className="p-2 w-full text-zinc-50 dark:text-zinc-950 font-medium bg-red-600 flex items-center justify-between">
                    <h1>Personal Info</h1>
                    <Button variant={"destructive"} className="bg-zinc-50 dark:bg-zinc-950 text-red-600 rounded-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900">Edit</Button>
                </div>
                <div className="space-y-4 flex flex-col items-center justify-center mt-10">
                    <div className="h-40 w-40 rounded-full bg-red-500 flex items-center cursor-pointer justify-center">
                        {data?.user.profileImage ? (
                            <Image src={data?.user.profileImage} alt={data.user.userName} />
                        ) : (
                            <User size={50} className="text-6xl text-zinc-50 dark:text-zinc-950" />
                        )}
                    </div>
                    <p className="text-xs font-semibold text-red-600">{data?.user.userName}</p>
                    <h1 className="text-red-600 text-3xl">{data?.user.name}</h1>
                </div>
            </section>
            <section className="col-span-2 overflow-x-auto  bg-zinc-50 h-screen">
                <h1 className="p-2 w-full text-zinc-50 dark:text-zinc-950 font-medium bg-red-600">Your Blogs</h1>
            </section>
            <section className="col-span-1 bg-zinc-50 h-screen">
                <div className="p-2 w-full text-zinc-50 dark:text-zinc-950 font-medium bg-red-600 flex items-center justify-between">
                    <h1>Uploaded Assets</h1>
                    <Button onClick={() => setShowImageUploadForm(true)} variant={"destructive"} className="bg-zinc-50 dark:bg-zinc-950 text-red-600 rounded-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900">Add</Button>
                </div>
            </section>
        </div>
    )
}