"use client"
import { getBlogById } from "@/app/actions/blogsAction"
import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
// import { format } from "date-fns"
import { FiHeart, FiMessageSquare, FiCalendar, FiUser } from "react-icons/fi"

interface BlogData {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnailUrl: string
  metaTitle: string
  metaDescription: string
  tags: string[]
  isPublished: boolean
  publishedAt: string
  likedBy: string[]
  comments: any[]
  isDeleted: boolean
  createdBy: {
    _id: string
    profileImage: string
    fullName: string
  }
  createdAt: string
  updatedAt: string
  __v: number
}

export default function Page({ params }: { params: { blogId: string } }): React.ReactElement {
  const { blogId } = params
  const { data } = useSession()
  const userId = data?.user.id || ""
  const [blogData, setBlogData] = useState<BlogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getBlogDetails = useCallback(async () => {
    try {
      setLoading(true)
      const { message, success, data, error } = await getBlogById(blogId, userId)
      console.log(message)
      console.log(data)
      console.log(success)
      console.log(error)
      if ( data) {
        setBlogData(data)
      } else {
        setError( "Failed to load blog post")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [blogId, userId])

  useEffect(() => {console.log(blogData)},[blogData])

  useEffect(() => {
    getBlogDetails()
  }, [getBlogDetails])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-red-600 rounded-full mb-4"></div>
          <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Blog</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-4">{error}</p>
          <button
            onClick={getBlogDetails}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!blogData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Blog not found</h2>
          <p className="text-zinc-600 dark:text-zinc-400">The requested blog post does not exist.</p>
        </div>
      </div>
    )
  }

//   const publishedDate = format(new Date(blogData.publishedAt), "MMMM dd, yyyy")

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="relative bg-zinc-900 text-zinc-50 overflow-hidden">
        {blogData.thumbnailUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={blogData.thumbnailUrl}
              alt={blogData.title}
              fill
              className="object-cover opacity-30"
              priority
            />
          </div>
        )}
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              {blogData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-red-600 text-xs font-semibold text-white uppercase tracking-wider rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{blogData.title}</h1>
            <p className="text-xl text-zinc-300 mb-8">{blogData.excerpt}</p>
            <div className="flex items-center justify-center space-x-6 text-zinc-300">
              <div className="flex items-center space-x-2">
                <FiUser className="text-red-500" />
                <span>{blogData.createdBy.fullName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCalendar className="text-red-500" />
                {/* <span>{publishedDate}</span> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose dark:prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: blogData.content }} />
          </div>

          {/* Author Bio */}
          <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-12">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
              <div className="flex-shrink-0">
                <Image
                  src={blogData.createdBy.profileImage}
                  alt={blogData.createdBy.fullName}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Written by {blogData.createdBy.fullName}
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {/* Published on {publishedDate} */}
                </p>
              </div>
            </div>
          </div>

          {/* Engagement Section */}
          <div className="mt-12 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-8">
            <button className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-500 transition-colors">
              <FiHeart className="text-lg" />
              <span>{blogData.likedBy.length} Likes</span>
            </button>
            <button className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-500 transition-colors">
              <FiMessageSquare className="text-lg" />
              <span>{blogData.comments.length} Comments</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Comments ({blogData.comments.length})
            </h3>
            {blogData.comments.length > 0 ? (
              <div className="space-y-6">
                {blogData.comments.map((comment) => (
                  <div key={comment._id} className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <div className="flex items-center space-x-4 mb-4">
                      <Image
                        src={comment.user.profileImage}
                        alt={comment.user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold">{comment.user.name}</h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {/* {format(new Date(comment.createdAt), "MMM dd, yyyy")} */}
                        </p>
                      </div>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400 italic">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Comment Form */}
          <div className="mt-12 bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Leave a comment
            </h3>
            <form className="space-y-4">
              <div>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  placeholder="Write your comment here..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Post Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}