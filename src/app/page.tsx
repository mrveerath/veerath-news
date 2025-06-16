"use client"
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="min-h-screen"> {/* Account for sticky navbar height */}
      <section className={cn(
        "flex items-center justify-center",
        "min-h-[calc(100vh-80px)]", // Subtract navbar height
        "p-4 sm:p-8",
        "border-t border-zinc-200 dark:border-zinc-800",
        "bg-white dark:bg-zinc-950",
        "lg:px-32" // Match navbar horizontal padding
      )}>
        <div className="w-full flex flex-col items-center justify-center gap-6 text-center">
          <h1 className={cn(
            "text-3xl md:text-4xl lg:text-5xl font-bold",
            "text-red-600 dark:text-red-600",
            "leading-tight"
          )}>
            Read, Write, Amplify – Your News, Your Way.
          </h1>
          
          <p className={cn(
            "text-base md:text-lg",
            "text-zinc-700 dark:text-zinc-300",
            "max-w-3xl mt-2",
            "leading-relaxed"
          )}>
            Where News Sparks Stories and Blogs Build Bridges.
            Dive into a dynamic platform that empowers you to
            explore real-time news, craft powerful stories
            inspired by the world around you, and share meaningful
            blogs that resonate far and wide.
          </p>

          <Link
            href="/blogs"
            className={cn(
              "bg-red-600 dark:bg-red-600",
              "text-zinc-50 dark:text-zinc-950",
              "font-semibold px-8 py-2",
              "border border-red-600 dark:border-red-600",
              "hover:bg-red-700 dark:hover:bg-red-600",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600",
              "shadow-none hover:shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)]",
              "rounded-none" // Sharp edges to match your style
            )}
          >
            Start Reading
          </Link>
        </div>
      </section>
    </main>
  );
}