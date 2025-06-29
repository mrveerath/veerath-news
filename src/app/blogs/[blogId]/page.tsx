"use client"
import { getBlogById } from "@/app/actions/blogsAction"
import {
  getAllComments, addComments, toggleCommentLike,
  deleteComment, toggleLikeToPost, toggleSavePost,
  checkIsSaved
} from "@/app/actions/likesCommentsAction"
import { useSession } from "next-auth/react"
import React, { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import {
  FiHeart, FiMessageSquare, FiCalendar, FiClock,
  FiTag, FiThumbsUp, FiTrash2, FiBookmark, FiShare2
} from "react-icons/fi"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Head from "next/head"

interface User {
  fullName: string;
  profileImage: string;
  _id: string;
  username?: string;
}

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
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: User;
  likedBy: User[];
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
  likedBy: string[];
  createdAt: Date | string;
}

interface CommentData {
  comment: string;
  commentedBy: string;
  blogId: string;
}

interface BlogPageParams {
  blogId: string;
}

export default function BlogPage({ params }: { params: Promise<BlogPageParams> }) {
  const resolvedParams = React.use(params);
  const blogId = resolvedParams.blogId;
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id || "";
  const [blogData, setBlogData] = useState<BlogDocument | null>(null);
  const [savedBy, setSavedBy] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<BlogComments[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const fetchBlogDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { message, success, data, error } = await getBlogById(blogId);
      if (!success || error) {
        throw new Error(message as string || "Failed to fetch blog post");
      }
      setBlogData(data as BlogDocument);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to load blog post");
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  const checkIsBlogSaved = useCallback(async () => {
    if (!userId || !blogData?._id) return;

    try {
      const { success, data } = await checkIsSaved(userId, blogData._id);
      if (success) {
        setSavedBy(data as boolean);
      }
    } catch (err) {
      console.error("Failed to check saved status:", err);
    }
  }, [userId, blogData?._id]);

  const fetchBlogComments = useCallback(async () => {
    try {
      const { success, data } = await getAllComments(blogId);
      if (success) {
        setComments(data as BlogComments[]);
      }
    } catch (err) {
      toast.error("Failed to load comments");
    }
  }, [blogId]);

  useEffect(() => {
    if (blogId) {
      fetchBlogDetails();
      fetchBlogComments();
    }
  }, [blogId, fetchBlogDetails, fetchBlogComments]);

  useEffect(() => {
    if (blogData?._id && userId) {
      checkIsBlogSaved();
    }
  }, [blogData?._id, userId, checkIsBlogSaved]);

  const handleLike = async () => {
    if (!blogData || isLiking) return;
    if (!userId) {
      toast.error("Please login to like posts");
      router.push("/login");
      return;
    }
    try {
      setIsLiking(true);
      const { success, message } = await toggleLikeToPost(userId, blogData._id);
      if (success) {
        setBlogData(prev => {
          if (!prev) return null;
          const isLiked = prev.likedBy.some(user => user._id === userId);
          const userData = {
            _id: userId,
            fullName: session?.user?.fullName || "",
            profileImage: session?.user?.profileImage || "",
          };
          return {
            ...prev,
            likedBy: isLiked
              ? prev.likedBy.filter(user => user._id !== userId)
              : [...prev.likedBy, userData],
            likesCount: isLiked ? prev.likesCount - 1 : prev.likesCount + 1
          };
        });
      } else {
        toast.error(message || "Failed to like post");
      }
    } catch (err) {
      toast.error("Failed to like blog");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSavePost = async () => {
    if (!blogData || isSaving) return;
    if (!userId) {
      toast.error("Please login to save posts");
      router.push("/login");
      return;
    }
    try {
      setIsSaving(true);
      const { success, message } = await toggleSavePost(userId, blogData._id);
      if (success) {
        setSavedBy(prev => !prev);
        toast.success(message || (savedBy ? "Post unsaved" : "Post saved"));
      } else {
        toast.error(message || "Failed to save post");
      }
    } catch (err) {
      toast.error("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSharePost = async () => {
    if (!blogData) return;

    try {
      setIsSharing(true);
      const shareData = {
        title: blogData.title,
        text: blogData.excerpt,
        url: `${window.location.origin}/blog/${blogData._id}`
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        await navigator.clipboard.writeText(`${window.location.origin}/blog/${blogData.slug || blogId}`);
        toast.success("Link copied to clipboard!");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!userId) {
      toast.error("Please login to comment");
      router.push("/login");
      return;
    }
    try {
      setIsCommenting(true);
      const commentData: CommentData = {
        comment: comment.trim(),
        commentedBy: userId,
        blogId,
      };

      const { success, message } = await addComments(commentData);
      if (success) {
        toast.success("Comment posted successfully!");
        setComment("");
        await fetchBlogComments();
      } else {
        toast.error(message || "Failed to post comment");
      }
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!userId) {
      toast.error("Please login to like comments");
      router.push("/login");
      return;
    }

    try {
      const { success } = await toggleCommentLike(commentId, userId);
      if (success) {
        setComments(prev => prev.map(comment => {
          if (comment.commentId === commentId) {
            const isLiked = comment.likedBy.includes(userId);
            return {
              ...comment,
              likes: isLiked
                ? comment.likedBy.filter(id => id !== userId).length
                : comment.likedBy.length + 1,
              likedBy: isLiked
                ? comment.likedBy.filter(id => id !== userId)
                : [...comment.likedBy, userId]
            };
          }
          return comment;
        }));
      }
    } catch (err) {
      toast.error("Failed to toggle comment like");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please login to delete comments");
      return;
    }

    try {
      const { success, message } = await deleteComment(commentId, userId);
      if (success) {
        toast.success("Comment deleted successfully");
        setComments(prev => prev.filter(comment => comment.commentId !== commentId));
      } else {
        toast.error(message || "Failed to delete comment");
      }
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(parsedDate.getTime())) return "";
    return format(parsedDate, "MMMM dd, yyyy");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-muted/50 mb-8">
            <Skeleton className="absolute inset-0 w-full h-full" />
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-card rounded-lg shadow-lg border">
          <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Blog</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchBlogDetails} variant="destructive">
              Try Again
            </Button>
            <Button onClick={() => router.push("/")} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!blogData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Blog not found</h2>
          <p className="text-muted-foreground">The requested blog post does not exist.</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Browse other posts
          </Button>
        </div>
      </div>
    );
  }

  const readTime = calculateReadTime(blogData.content);
  const publishedDate = formatDate(blogData.createdAt);
  const isLiked = blogData.likedBy.some(user => user._id === userId);
  const commentCount = comments.length;

  return (
    <>
      <Head>
        <title>{blogData.metaTitle || blogData.title}</title>
        <meta name="description" content={blogData.metaDescription || blogData.excerpt} />
        <meta property="og:title" content={blogData.metaTitle || blogData.title} />
        <meta property="og:description" content={blogData.metaDescription || blogData.excerpt} />
        {blogData.thumbnailUrl && (
          <meta property="og:image" content={blogData.thumbnailUrl} />
        )}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                {blogData.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag.toLowerCase()}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <FiTag className="mr-1" size={12} />
                    {tag}
                  </Link>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
                {blogData.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8">
                {blogData.excerpt}
              </p>

              {/* Author and Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/profile/${blogData.createdBy._id}`}
                    className="flex items-center gap-2 group"
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-muted-foreground/20">
                      <Image
                        src={blogData.createdBy.profileImage}
                        alt={blogData.createdBy.fullName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {blogData.createdBy.fullName}
                    </span>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FiCalendar className="text-primary" size={14} />
                    <span>{publishedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock className="text-primary" size={14} />
                    <span>{readTime} min read</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-6 border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center gap-2"
                  aria-label={isLiked ? "Unlike post" : "Like post"}
                >
                  <FiHeart
                    className={`text-lg ${isLiked ? "text-red-500 fill-red-500" : ""}`}
                  />
                  <span>
                    {blogData.likedBy.length.toString()} {blogData.likesCount === 1 ? "Like" : "Likes"}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSavePost}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                  aria-label={savedBy ? "Unsave post" : "Save post"}
                >
                  <FiBookmark
                    className={`text-lg ${savedBy ? "text-yellow-500 fill-yellow-500" : ""}`}
                  />
                  <span>{savedBy ? "Saved" : "Save"}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSharePost}
                  disabled={isSharing}
                  className="flex items-center gap-2"
                  aria-label="Share post"
                >
                  <FiShare2 className="text-lg" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Thumbnail Image */}
            {blogData.thumbnailUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden mb-8 md:mb-12 border border-muted-foreground/20">
                <Image
                  src={blogData.thumbnailUrl}
                  alt={blogData.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
            )}
            {/* Blog Content */}
            <article
              className="prose dark:prose-invert prose-lg max-w-none article"
              dangerouslySetInnerHTML={{ __html: blogData.content }}
            ></article>
            {/* Author Bio */}
            <div className="mt-12 pt-8 border-t border-muted-foreground/20">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-muted/50 rounded-xl">
                <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border border-muted-foreground/20">
                  <Image
                    src={blogData.createdBy.profileImage}
                    alt={blogData.createdBy.fullName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold">
                    Written by {blogData.createdBy.fullName}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Published on {publishedDate}
                  </p>
                  {blogData.createdBy.username && (
                    <Link
                      href={`/profile/${blogData.createdBy._id}`}
                      className="mt-3 inline-block text-sm text-primary hover:underline"
                    >
                      View profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {/* Comments Section */}
            <div className="mt-12 pt-8 border-t border-muted-foreground/20">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">
                  Comments ({commentCount})
                </h3>
              </div>
              {/* Comment Form */}
              {status === "authenticated" ? (
                <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8">
                  <div>
                    <label htmlFor="comment" className="sr-only">Your comment</label>
                    <textarea
                      id="comment"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-muted-foreground/30 focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-all"
                      placeholder="Share your thoughts..."
                      disabled={isCommenting}
                      aria-label="Comment input"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!comment.trim() || isCommenting}
                      className="bg-primary hover:bg-primary/90 rounded-lg"
                    >
                      {isCommenting ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-muted-foreground">
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in
                    </Link> to leave a comment
                  </p>
                </div>
              )}
              {/* Comments List */}
              <div className="space-y-6" id="comments">
                {commentCount > 0 ? (
                  comments.map((comment) => {
                    const commentDate = formatDate(comment.createdAt);
                    const isCommentLiked = comment?.likedBy?.includes(userId);
                    const isCommentAuthor = comment.createdBy.id === userId;
                    return (
                      <div key={comment.commentId} className="pb-6 border-b border-muted-foreground/10 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <Link
                            href={`/profile/${comment.createdBy.id}`}
                            className="flex-shrink-0"
                          >
                            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-muted-foreground/20">
                              <Image
                                src={comment.createdBy.profileImage}
                                alt={comment.createdBy.fullName}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/profile/${comment.createdBy.id}`}
                                  className="font-medium hover:text-primary transition-colors"
                                >
                                  {comment.createdBy.fullName}
                                </Link>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {commentDate}
                                </p>
                              </div>
                              {isCommentAuthor && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteComment(comment.commentId)}
                                  className="text-destructive hover:text-destructive/80 h-8 w-8"
                                  aria-label="Delete comment"
                                >
                                  <FiTrash2 size={16} />
                                </Button>
                              )}
                            </div>
                            <p className="mt-2 text-muted-foreground">{comment.content}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleCommentLike(comment.commentId)}
                                className="flex items-center gap-1 h-8"
                                aria-label={isCommentLiked ? "Unlike comment" : "Like comment"}
                              >
                                <FiThumbsUp
                                  className={`text-base ${isCommentLiked ? "text-blue-500 fill-blue-500" : ""}`}
                                />
                                <span className="text-sm">
                                  {comment.likes} {comment.likes === 1 ? "like" : "likes"}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <FiMessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No comments yet</h3>
                    <p className="mt-2 text-muted-foreground">
                      {status === "authenticated"
                        ? "Be the first to share what you think!"
                        : "Sign in to be the first to comment."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
