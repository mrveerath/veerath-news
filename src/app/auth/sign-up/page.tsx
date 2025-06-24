"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from '@/app/actions/authActions';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistrationPage():React.ReactElement {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("")
    const redirect = useRouter()
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    const handleFormAction = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")
        toast.loading("Signing UP...")
        const formData = new FormData(event.currentTarget);

        const result = registerUser(formData)
        if (!(await result).success) {
            toast.dismiss()
            toast.error((await result).error)
            setError((await result).error)
        }
        else {
            setError("")
            toast.success("User Signed IN Successfully...")
            redirect.push("/auth/sign-in")
        }

    }
    return (
        <div className={cn(
            "flex items-center justify-center min-h-screen p-4 sm:p-8 w-full bg-zinc-200 dark:bg-zinc-800"
        )}>
            <form
                className={cn(
                    "bg-zinc-50/50 dark:bg-zinc-900 p-6 sm:p-8 space-y-6 w-full max-w-md shadow-md"
                )}
                onSubmit={handleFormAction}
            >
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold text-red-600">Register</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-center">
                        Please fill in the details to create an account
                    </p>
                    {error && (<p className='text-orange-600'>{error}</p>)}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userName" className="text-zinc-700 dark:text-zinc-300">
                            Username
                        </Label>
                        <Input
                            type="text"
                            id="userName"
                            name="userName"
                            placeholder="John_doe"
                            className="border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
                            Email
                        </Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="john_doe@example.com"
                            className="border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-zinc-700 dark:text-zinc-300">
                            Full Name
                        </Label>
                        <Input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="John Doe"
                            className="border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">
                            Password
                        </Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Password"
                                className="border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none w-full"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="text-zinc-500" /> : <Eye className="text-zinc-500" />}
                            </button>
                        </div>
                    </div>


                    <Button
                        type="submit"
                        className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-none"
                    >
                        Register
                    </Button>
                    <div className='my-3 flex items-center justify-between'>
                        <Link href='#' className='text-xs font-semibold text-red-600 underline'>Reset Password</Link>
                        <Link href='/auth/sign-in' className='text-xs font-semibold text-red-600'>Sign-In</Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
