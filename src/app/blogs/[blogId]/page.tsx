"use client"
import { getBlogById } from "@/app/actions/blogsAction"
import { getAllComments, addComments, toggleCommentLike, deleteComment } from "@/app/actions/likesCommentsAction"
import { useSession } from "next-auth/react"
import React, { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { FiHeart, FiMessageSquare, FiCalendar, FiClock, FiTag, FiThumbsUp, FiTrash2 } from "react-icons/fi"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

interface BlogDocument {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  tags: string[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    fullName: string;
    profileImage: string;
    _id: string;
  };
  likedBy: Array<{
    fullName: string;
    profileImage: string;
    _id: string;
  }>;
  likesCount: number;
}

interface BlogComments {
  commentId: string;
  createdBy: {
    fullName: string;
    id: string;
    profileImage: string;
  };
  content: string;
  likes: number;
}

interface CommentData {
  comment: string;
  commentedBy: string;
  blogId: string;
}

export default function BlogPage({ params }: { params: { blogId: string } }) {
  const { blogId } = React.use(params)
  const { data: session } = useSession()
  const userId = session?.user.id || ""

  const [blogData, setBlogData] = useState<BlogDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isLiking, setIsLiking] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<BlogComments[] | null>(null)
  const [isCommenting, setIsCommenting] = useState(false)

  const fetchBlogDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const { message, success, data, error } = await getBlogById(blogId)

      if (!success || error) {
        throw new Error(message as string || "Failed to fetch blog post")
      }

      setBlogData(data as BlogDocument)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast.error("Failed to load blog post")
    } finally {
      setLoading(false)
    }
  }, [blogId])

  const fetchBlogComments = useCallback(async () => {
    try {
      const { success, data, message, error } = await getAllComments(blogId)
      if (!success || error) {
        throw new Error(message || "Failed to fetch comments")
      }
      setComments(data as BlogComments[])
    } catch (err) {
      toast.error("Failed to load comments")
    }
  }, [blogId])

  useEffect(() => {
    fetchBlogDetails()
    fetchBlogComments()
  }, [fetchBlogDetails, fetchBlogComments])

  const handleLike = async () => {
    if (!blogData || isLiking) return

    try {
      setIsLiking(true)
      // Implement your like logic here
      // await likeBlog(blogId, userId)
      toast.success("Blog liked successfully!")
      await fetchBlogDetails()
    } catch (err) {
      toast.error("Failed to like blog")
    } finally {
      setIsLiking(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || isCommenting) return

    try {
      setIsCommenting(true)
      const commentData: CommentData = {
        comment: comment.trim(),
        commentedBy: userId,
        blogId,
      }
      const { success, message, error } = await addComments(commentData)
      if (!success || error) {
        throw new Error(message || "Failed to post comment")
      }
      toast.success("Comment posted successfully!")
      setComment("")
      await fetchBlogComments()
    } catch (err) {
      toast.error("Failed to post comment")
    } finally {
      setIsCommenting(false)
    }
  }

  const handleToggleCommentLike = async (commentId: string) => {
    if (!userId) {
      toast.error("Please log in to like comments")
      return
    }
    try {
      const { success, message, data, error } = await toggleCommentLike(commentId, userId)
      if (!success || error) {
        throw new Error(message || "Failed to toggle comment like")
      }
      toast.success(message)
      await fetchBlogComments()
    } catch (err) {
      toast.error("Failed to toggle comment like")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please log in to delete comments")
      return
    }
    try {
      const { success, message, error } = await deleteComment(commentId, userId)
      if (!success || error) {
        throw new Error(message || "Failed to delete comment")
      }
      toast.success("Comment deleted successfully")
      await fetchBlogComments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment")
    }
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="relative h-96 rounded-xl overflow-hidden bg-muted mb-8">
            <Skeleton className="absolute inset-0 w-full h-full" />
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <div className="flex items-center gap-4 mb-12">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-card rounded-lg shadow-lg border">
          <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Blog</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            onClick={fetchBlogDetails}
            variant="destructive"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!blogData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Blog not found</h2>
          <p className="text-muted-foreground">The requested blog post does not exist.</p>
        </div>
      </div>
    )
  }

  const readTime = calculateReadTime(blogData.content)
  const publishedDate = format(new Date(blogData.createdAt), "MMMM dd, yyyy")

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 overflow-hidden">
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-6">
              {blogData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  <FiTag className="mr-1" size={12} />
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              {blogData.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {blogData.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 rounded-full overflow-hidden border">
                  <Image
                    src={blogData.createdBy.profileImage}
                    alt={blogData.createdBy.fullName}
                    fill
                    className="object-cover"
                  />
                </div>
                <Link href={`/profile/${blogData.createdBy._id}`}>
                  <p className="text-zinc-900 dark:text-white leading-none">{blogData.createdBy.fullName}</p>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-primary" />
                <span>{publishedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-primary" />
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {blogData.thumbnailUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-12 border">
              <Image
                src={blogData.thumbnailUrl}
                alt={blogData.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <article
            className="prose dark:prose-invert prose-lg max-w-none article"
            dangerouslySetInnerHTML={{ __html: blogData.content }}
          ></article>
          <div className="mt-16 pt-8 border-t">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-2"
              >
                <FiHeart
                  className={`text-lg ${blogData.likedBy.some(like => like._id.toString() === userId) ? "text-red-500 fill-red-500" : ""}`}
                />
                <span>
                  {blogData.likedBy.length} {blogData.likedBy.length === 1 ? "Like" : "Likes"}
                </span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiMessageSquare />
                <span>{comments?.length || 0} {comments?.length === 1 ? "Comment" : "Comments"}</span>
              </div>
            </div>
          </div>
          <div className="mt-16 p-6 bg-muted/50 rounded-xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative h-20 w-20 rounded-full overflow-hidden border">
                <Image
                  src={blogData.createdBy.profileImage}
                  alt={blogData.createdBy.fullName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold">
                  Written by {blogData.createdBy.fullName}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Published on {publishedDate}
                </p>
                <p className="mt-4">
                  {/* Add author bio here if available */}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8">
              Comments ({comments?.length || 0})
            </h3>
            <form onSubmit={handleCommentSubmit} className="space-y-4 mb-12">
              <div>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  placeholder="Share your thoughts..."
                  disabled={isCommenting}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!comment.trim() || isCommenting} className="bg-red-600">
                  Post Comment
                </Button>
              </div>
            </form>
            <div className="space-y-8">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.commentId} className="border-b pb-8">
                    <div className="flex items-start gap-4">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border">
                        <Image
                          src={comment.createdBy.profileImage || "/default-avatar.png"}
                          alt={comment.createdBy.fullName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{comment.createdBy.fullName}</h4>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="mt-2 text-muted-foreground">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <Button
                            variant="ghost"
                            onClick={() => handleToggleCommentLike(comment.commentId)}
                            className="flex items-center gap-2"
                          >
                            <FiThumbsUp
                              className={`text-lg ${comment.likes > 0 ? "text-blue-500" : ""}`}
                            />
                            <span>{comment.likes} {comment.likes === 1 ? "Like" : "Likes"}</span>
                          </Button>
                          {comment.createdBy.id === userId && (
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment.commentId)}
                              className="flex items-center gap-2 text-destructive"
                            >
                              <FiTrash2 />
                              <span>Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}