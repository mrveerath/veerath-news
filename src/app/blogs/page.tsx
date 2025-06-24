"use client"
import React, { useCallback, useEffect, useState } from "react"
import { GetBlogsResponse, getPaginatedBlogs } from "../actions/blogsAction"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import BlogCard from "./component/BlogCard"
import Head from "next/head"

export default function Page(): React.ReactElement {
  const [blogs, setBlogs] = useState<GetBlogsResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("New")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const getAllBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const { success, data, error } = await getPaginatedBlogs(1, 10)
      if (success && data) {
        if (Array.isArray(data.allBlogs)) {
          setBlogs(data.allBlogs)
        } else {
          console.error("Data is not an array:", data)
          toast.error("Data format is incorrect")
        }
      } else {
        toast.error(error || "Failed to fetch blogs")
      }
    } catch (err) {
      console.error("An unexpected error occurred:", err)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getAllBlogs()
  }, [getAllBlogs])

  const filters = ["Trending", "New", "Most Liked", "Most Viewed"]
  const tags = ["Technology", "Agriculture", "Aviation", "Coding", "Python", "Nepal", "India"]

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <>
      <Head>
        <title>Blog Posts | Explore Our Latest Articles</title>
        <meta name="description" content="Browse our collection of blog posts on various topics including technology, agriculture, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Blog Posts | Explore Our Latest Articles" />
        <meta property="og:description" content="Browse our collection of blog posts on various topics including technology, agriculture, and more." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div 
        className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen w-full px-4 md:px-24 py-8 grid grid-cols-1 lg:grid-cols-4 gap-5"
        aria-label="Blog posts page"
      >
        {/* Filters Sidebar */}
        <aside 
          className="lg:col-span-1 bg-zinc-100 dark:bg-zinc-900 p-4 space-y-6 rounded-none border border-zinc-200 dark:border-zinc-800"
          aria-label="Filters sidebar"
        >
          <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Filters</h1>

          <section aria-labelledby="sort-by-heading">
            <h2 id="sort-by-heading" className="font-medium text-zinc-700 dark:text-zinc-300">Sort By</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sort options">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-none ${
                    activeFilter === filter 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                  }`}
                  aria-pressed={activeFilter === filter}
                  aria-label={`Sort by ${filter}`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </section>

          <section aria-labelledby="tags-heading">
            <h2 id="tags-heading" className="font-medium text-zinc-700 dark:text-zinc-300">Tags</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tag filters">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  size="sm"
                  onClick={() => handleTagClick(tag)}
                  className={`rounded-none ${
                    selectedTags.includes(tag)
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                  }`}
                  aria-pressed={selectedTags.includes(tag)}
                  aria-label={`Filter by ${tag} tag`}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </section>
        </aside>

        {/* Main Content */}
        <main 
          className="lg:col-span-2 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-none border border-zinc-200 dark:border-zinc-800 space-y-6"
          aria-label="Blog posts"
        >
          <div className="flex items-center gap-2 w-full" role="search">
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-none bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              aria-label="Search blog posts"
            />
            <Button 
              size="icon" 
              className="bg-red-600 hover:bg-red-700 text-white rounded-none"
              aria-label="Submit search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div 
              className="flex justify-center items-center h-64"
              aria-live="polite"
              aria-busy="true"
            >
              <p className="text-zinc-600 dark:text-zinc-400">Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div 
              className="flex justify-center items-center h-64"
              aria-live="polite"
            >
              <p className="text-zinc-600 dark:text-zinc-400">No blogs found matching your criteria</p>
            </div>
          ) : (
            <div className="grid gap-6" aria-label="Blog posts list">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} details={blog} />
              ))}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside 
          className="lg:col-span-1 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-none border border-zinc-200 dark:border-zinc-800"
          aria-label="Popular tags"
        >
          <h2 className="text-xl font-bold mb-4 text-zinc-800 dark:text-zinc-200">Popular Tags</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Popular tags">
            {tags.map(tag => (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                className={`text-sm rounded-none ${
                  selectedTags.includes(tag)
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                }`}
                onClick={() => handleTagClick(tag)}
                aria-pressed={selectedTags.includes(tag)}
                aria-label={`${tag} tag`}
              >
                #{tag}
              </Button>
            ))}
          </div>
        </aside>
      </div>
    </>
  )
}