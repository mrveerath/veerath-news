"use client"

import * as React from "react"
import Link from "next/link"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Image from "next/image"
import { ModeToggle } from "./theme-switcher"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"

import { cn } from "@/lib/utils"

import { useSession } from "next-auth/react"
import SignInBtn from "./SignIN"
import SignOutBtn from "./SignOut"
import Profile from "./Profile"

export function Navbar() {
    const data = useSession()
    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 px-20">
            <nav className="flex items-center justify-between w-full  py-3 ">
                {/* Logo */}
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            alt="logo"
                            src="/navLogo.png"
                            width={32}
                            height={32}
                            className="h-4 w-16"
                            priority
                        />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "rounded-none")}>
                                    <Link href="/" className="hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                        Home
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "rounded-none")}>
                                    <Link href="/blogs" className="hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                        Blogs
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "rounded-none")}>
                                    <Link href="/create-blog" className="hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                        Create
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center gap-2">
                        <ModeToggle />
                        {
                            data.status === "authenticated" ? (
                                <>
                                    <Profile />
                                    <SignOutBtn />
                                </>
                            ) : (
                                <SignInBtn />
                            )
                        }
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex lg:hidden items-center gap-2">
                        <ModeToggle />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-none border-zinc-300 dark:border-zinc-900">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[350px] rounded-none border-l-zinc-200 dark:border-l-zinc-900">
                                <div className="flex flex-col gap-0 pt-6">
                                    <Link href="/" className="w-full p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900">
                                        Home
                                    </Link>


                                    <Link href="/blogs" className="w-full p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900">
                                        Blogs
                                    </Link>

                                    <Link href="/create-blog" className="w-full p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900">
                                        Create
                                    </Link>

                                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-900">
                                        {
                                            data.status === "authenticated" ? (
                                                <>
                                                    <Profile />
                                                    <SignOutBtn />
                                                </>
                                            ) : (
                                                <SignInBtn />
                                            )
                                        }
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const components: { title: string; href: string; description: string }[] = [
    {
        title: "Alert Dialog",
        href: "/docs/primitives/alert-dialog",
        description: "A modal dialog that interrupts the user with important content.",
    },
    {
        title: "Hover Card",
        href: "/docs/primitives/hover-card",
        description: "For sighted users to preview content available behind a link.",
    },
]

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { href: string }
>(({ className, title, children, href, ...props }, ref) => {
    return (
        <li className="border-b border-zinc-200 dark:border-zinc-900 last:border-b-0">
            <NavigationMenuLink asChild>
                <Link
                    ref={ref}
                    href={href}
                    className={cn(
                        "block select-none space-y-1 p-4 leading-none no-underline outline-none transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-900 dark:hover:text-red-400",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-zinc-500 dark:text-zinc-400">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"