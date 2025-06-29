"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  FiHeart,
  FiMessageSquare,
  FiCalendar,
  FiClock,
  FiTag,
  FiThumbsUp,
  FiTrash2,
  FiBookmark,
  FiShare2,
} from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BlogDocument, getBlogById } from "@/app/actions/blogsAction";
import {
  addComments,
  BlogComments,
  checkIsSaved,
  deleteComment,
  getAllComments,
  toggleCommentLike,
  toggleLikeToPost,
  toggleSavePost,
} from "@/app/actions/likesCommentsAction";


interface BlogPageParams {
  slug: string;
}

export default function BlogPage({ params }: { params: Promise<BlogPageParams> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // State management hooks
  const [blog, setBlog] = useState<BlogDocument | null>(null);
  const [comments, setComments] = useState<BlogComments[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLikingPost, setIsLikingPost] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [commentData, setCommentData] = useState<string>("");

  // Refs for DOM elements
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const commentFormRef = useRef<HTMLFormElement>(null);
  const lastCommentRef = useRef<HTMLLIElement>(null);

  // Derived values
  const userId = session?.user?.id || "";

  // Memoized values
  const readTime = useMemo(() => {
    if (!blog?.content) return 0;
    const wordsPerMinute = 200;
    const wordCount = blog.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }, [blog?.content]);

  const formattedDate = useMemo(() => {
    if (!blog?.createdAt) return "";
    return format(new Date(blog.createdAt), "MMMM dd, yyyy");
  }, [blog?.createdAt]);

  const isPostLiked = useMemo(() => {
    return blog?.likedBy.includes(userId) || false;
  }, [blog?.likedBy, userId]);

  // Fetch blog data by slug
  const fetchBlogData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch blog by slug
      const blogResponse = await getBlogById(resolvedParams.slug);

      if (!blogResponse.success || !blogResponse.data) {
        throw new Error(blogResponse.message || "Failed to fetch blog post");
      }

      setBlog(blogResponse.data as BlogDocument);

      // Check if we need to scroll to comments
      if (searchParams.get("focus") === "comments") {
        setTimeout(() => {
          commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to load blog post");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.slug, searchParams]);

  // Fetch comments by blog ID
  const fetchCommentsData = useCallback(async (blogId: string) => {
    try {
      const commentsResponse = await getAllComments(blogId);

      if (!commentsResponse.success || !commentsResponse.data) {
        throw new Error(commentsResponse.message || "Failed to fetch comments");
      }

      setComments(commentsResponse.data as BlogComments[]);
    } catch (err) {
      console.error("Failed to load comments:", err);
      toast.error("Failed to load comments");
    }
  }, []);

  // Check if post is saved
  const checkSavedStatus = useCallback(async () => {
    if (!userId || !blog) return;

    try {
      const response = await checkIsSaved(userId, blog._id);
      if (response.success) {
        setIsSaved(response.data === "Saved" ? true : false);
      }
    } catch (err) {
      console.error("Failed to check saved status:", err);
    }
  }, [userId, blog]);

  // Effect for initial data loading
  useEffect(() => {
    fetchBlogData();
  }, [fetchBlogData]);

  // Effect for fetching comments when blog is available
  useEffect(() => {
    if (blog?._id) {
      fetchCommentsData(blog._id);
    }
  }, [blog?._id, fetchCommentsData]);

  // Effect for checking saved status when blog or user changes
  useEffect(() => {
    if (blog) {
      checkSavedStatus();
    }
  }, [blog, checkSavedStatus]);


  // Effect for auto-focusing comment input when hash changes
  useEffect(() => {
    if (window.location.hash === "#comment-form") {
      commentFormRef.current?.scrollIntoView({ behavior: "smooth" });
      const textarea = commentFormRef.current?.querySelector("textarea");
      textarea?.focus();
    }
  }, []);

  // Like/unlike post
  const handleLikePost = async () => {
    if (!blog || isLikingPost) return;

    if (!userId) {
      toast.error("Please login to like posts");
      router.push("/login");
      return;
    }

    try {
      setIsLikingPost(true);
      const response = await toggleLikeToPost(userId, blog._id);

      if (response.success && blog) {
        const isCurrentlyLiked = blog.likedBy.includes(userId);

        setBlog({
          ...blog,
          likedBy: isCurrentlyLiked
            ? blog.likedBy.filter((id) => id !== userId)
            : [...blog.likedBy, userId],
        });
      } else {
        toast.error(response.message || "Failed to update like");
      }
    } catch (err) {
      console.log(err)
      toast.error("Failed to update like");
    } finally {
      setIsLikingPost(false);
    }
  };

  // Save/unsave post
  const handleSavePost = async () => {
    if (!blog || isSavingPost) return;

    if (!userId) {
      toast.error("Please login to save posts");
      router.push("/login");
      return;
    }

    try {
      setIsSavingPost(true);
      const response = await toggleSavePost(userId, blog._id);
      console.log(response);

      if (response.success) {
        checkSavedStatus();
        setIsSaved((prev) => !prev);
        toast.success(isSaved ? "Post unsaved" : "Post saved");
      } else {
        toast.error(response.message || "Failed to update save status");
      }
    } catch (err) {
      console.log(err)
      toast.error("Failed to update save status");
    } finally {
      setIsSavingPost(false);
    }
  };

  // Share post
  const handleSharePost = async () => {
    if (!blog) return;

    try {
      setIsSharing(true);
      const shareData = {
        title: blog.title,
        text: blog.excerpt,
        url: `${window.location.origin}/blog/${blog._id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (!(err instanceof Error) || err.name !== "AbortError") {
        await navigator.clipboard.writeText(
          `${window.location.origin}/blog/${blog._id}`
        );
        toast.success("Link copied to clipboard!");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentData.trim() || !blog) return;

    toast.info("commenting...");

    if (!userId) {
      toast.error("Please login to comment");
      router.push("/login");
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await addComments({
        blogId: blog._id,
        commentedBy: userId,
        comment: commentData.trim(),
      });
      toast.dismiss();
      setCommentData("");
      if (response.success && response.data) {
        setComments((prev) => [...prev, response.data as BlogComments]);
        setCommentData("");
        toast.success("Comment posted successfully!");

        // Scroll to new comment after a brief delay
        setTimeout(() => {
          lastCommentRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        toast.error(response.message || "Failed to post comment");
      }
    } catch (err) {
      console.log(err)
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Like/unlike comment
  const handleLikeComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please login to like comments");
      router.push("/login");
      return;
    }

    try {
      const response = await toggleCommentLike(commentId, userId);
      if (response.success) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  likedBy: comment.likedBy.includes(userId)
                    ? comment.likedBy.filter((id) => id !== userId)
                    : [...comment.likedBy, userId],
                  likes: comment.likedBy.includes(userId)
                    ? comment.likes - 1
                    : comment.likes + 1,
                }
              : comment
          )
        );
      }
    } catch (err) {
      console.log(err)
      toast.error("Failed to update comment like");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please login to delete comments");
      return;
    }

    try {
      const response = await deleteComment(commentId, userId);

      if (response.success) {
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
        toast.success("Comment deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete comment");
      }
    } catch (err) {
      console.log(err)
      toast.error("Failed to delete comment");
    }
  };

  // Loading state
  if (isLoading) {
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-card rounded-lg shadow-lg border">
          <h2 className="text-xl font-bold text-destructive mb-2">
            Error Loading Blog
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchBlogData} variant="destructive">
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

  // Blog not found state
  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Blog not found</h2>
          <p className="text-muted-foreground">
            The requested blog post does not exist.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Browse other posts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Blog Header */}
      <header className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.tags.map((tag) => (
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

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              {blog.title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              {blog.excerpt}
            </p>

            {/* Author and Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${blog.createdBy._id}`}
                  className="flex items-center gap-2 group"
                >
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border border-muted-foreground/20">
                    <Image
                      src={blog.createdBy.profileImage}
                      alt={blog.createdBy.fullName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    {blog.createdBy.fullName}
                  </span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FiCalendar className="text-primary" size={14} />
                  <span>{formattedDate}</span>
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
                onClick={handleLikePost}
                disabled={isLikingPost}
                className="flex items-center gap-2"
                aria-label={isPostLiked ? "Unlike post" : "Like post"}
              >
                <FiHeart
                  className={`text-lg ${
                    blog.likedBy.includes(userId)
                      ? "text-red-500 fill-red-500"
                      : ""
                  }`}
                />
                <span>
                  {blog.likedBy.length}{" "}
                  {blog.likedBy.length === 1 ? "Like" : "Likes"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSavePost}
                disabled={isSavingPost}
                className="flex items-center gap-2"
                aria-label={isSaved ? "Unsave post" : "Save post"}
              >
                <FiBookmark
                  className={`text-lg ${
                    isSaved ? "text-yellow-500 fill-yellow-500" : ""
                  }`}
                />
                <span>{isSaved ? "Saved" : "Save"}</span>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Thumbnail Image */}
          {blog.thumbnailUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-8 md:mb-12 border border-muted-foreground/20">
              <Image
                src={blog.thumbnailUrl}
                alt={blog.title}
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
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Author Bio */}
          <div className="mt-12 pt-8 border-t border-muted-foreground/20">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-muted/50 rounded-xl">
              <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border border-muted-foreground/20">
                <Image
                  src={blog.createdBy.profileImage}
                  alt={blog.createdBy.fullName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold">
                  Written by {blog.createdBy.fullName}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Published on {formattedDate}
                </p>
                {blog.createdBy && (
                  <Link
                    href={`/profile/${blog.createdBy._id}`}
                    className="mt-3 inline-block text-sm text-primary hover:underline"
                  >
                    View profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div
            ref={commentsSectionRef}
            className="mt-12 pt-8 border-t border-muted-foreground/20"
            id="comments"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                Comments ({comments.length})
              </h3>
            </div>

            {/* Comment Form */}
            {status === "authenticated" ? (
              <form
                ref={commentFormRef}
                onSubmit={handleSubmitComment}
                className="space-y-4 mb-8"
                id="comment-form"
              >
                <div>
                  <label htmlFor="comment" className="sr-only">
                    Your comment
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={commentData}
                    onChange={(e) => setCommentData(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-muted-foreground/30 focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-all"
                    placeholder="Share your thoughts..."
                    disabled={isSubmittingComment}
                    aria-label="Comment input"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!commentData}
                    className="bg-primary hover:bg-primary/90 rounded-lg"
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to leave a comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <ul className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment, index) => {
                  const isCommentLiked = comment.likedBy.includes(userId);
                  const isCommentAuthor = comment.createdBy.id === userId;
                  const commentDate = format(
                    new Date(comment.createdAt),
                    "MMMM dd, yyyy"
                  );

                  return (
                    <li
                      key={comment.commentId}
                      className="pb-6 border-b border-muted-foreground/10 last:border-0 last:pb-0"
                      ref={index === comments.length - 1 ? lastCommentRef : null}
                    >
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
                                onClick={() =>
                                  handleDeleteComment(comment.commentId)
                                }
                                className="text-destructive hover:text-destructive/80 h-8 w-8"
                                aria-label="Delete comment"
                              >
                                <FiTrash2 size={16} />
                              </Button>
                            )}
                          </div>
                          <p className="mt-2 text-muted-foreground">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleLikeComment(comment.commentId)
                              }
                              className="flex items-center gap-1 h-8"
                              aria-label={
                                isCommentLiked
                                  ? "Unlike comment"
                                  : "Like comment"
                              }
                            >
                              <FiThumbsUp
                                className={`text-base ${
                                  isCommentLiked
                                    ? "text-blue-500 fill-blue-500"
                                    : ""
                                }`}
                              />
                              <span className="text-sm">
                                {comment.likes}{" "}
                                {comment.likes === 1 ? "like" : "likes"}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <FiMessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">
                    No comments yet
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {status === "authenticated"
                      ? "Be the first to share what you think!"
                      : "Sign in to be the first to comment."}
                  </p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
