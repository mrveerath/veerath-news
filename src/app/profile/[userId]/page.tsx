"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FiHeart, FiMessageSquare, FiCalendar, FiUser } from "react-icons/fi";
import { getCompleteUserDetails } from "@/app/actions/userAction";
import { toast } from "sonner";
import { getCommentedPosts, getLikedPosts } from "@/app/actions/likesCommentsAction";

export interface CompleteUserDetails {
  userName: string;
  email: string;
  profileImage: string;
  fullName: string;
  bio: string;
  savedPost: string[];
  interests: string[];
}

interface LikedPosts {
  id: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  createdBy: {
    fullName: string;
    profileImage: string;
    id: string;
  };
}

interface CommentedPosts {
  id: string;
  commentId: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  createdBy: {
    fullName: string;
    profileImage: string;
    id: string;
  };
}

export default function Page({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { data: session } = useSession();
  const [userDetails, setUserDetails] = useState<CompleteUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<LikedPosts[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<CommentedPosts[]>([]);

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { success, data, message } = await getCompleteUserDetails(userId);
      if (!success) {
        toast.error(message || "Failed to load user details");
        return;
      }
      setUserDetails(data);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading user data");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchLikedPosts = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { success, data, message } = await getLikedPosts(userId);
      if (!success) {
        toast.error(message || "Failed to load liked posts");
        return;
      }
      setLikedPosts(data as LikedPosts[]);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading liked posts");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchCommentedPosts = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { success, data, message } = await getCommentedPosts(userId);
      if (!success) {
        toast.error(message || "Failed to load commented posts");
        return;
      }
      setCommentedPosts(data as CommentedPosts[]);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading commented posts");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchLikedPosts();
      fetchCommentedPosts();
    }
  }, [userId, fetchUserDetails, fetchLikedPosts, fetchCommentedPosts]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">User not found</h2>
          <p className="text-zinc-600 dark:text-zinc-400">The requested user does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-40 h-40 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden rounded-lg border-2 border-zinc-600 mb-4">
              {userDetails.profileImage ? (
                <Image
                  src={userDetails.profileImage}
                  alt={userDetails.fullName}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <FiUser className="text-zinc-500 dark:text-zinc-400" size={48} />
              )}
            </div>
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{userDetails.fullName}</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">@{userDetails.userName}</p>
          </div>

          {/* User Details */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-zinc-700 dark:text-zinc-300">{userDetails.bio || "No bio available."}</p>
          </div>

          {/* User Activity */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">Activity</h2>
            <div className="flex justify-around">
              <div className="text-center">
                <FiHeart className="mx-auto text-zinc-500 dark:text-zinc-400 mb-2" size={24} />
                <p className="font-bold text-zinc-800 dark:text-zinc-100">{likedPosts.length}</p>
                <p className="text-zinc-600 dark:text-zinc-400">Likes</p>
              </div>
              <div className="text-center">
                <FiMessageSquare className="mx-auto text-zinc-500 dark:text-zinc-400 mb-2" size={24} />
                <p className="font-bold text-zinc-800 dark:text-zinc-100">{commentedPosts.length}</p>
                <p className="text-zinc-600 dark:text-zinc-400">Comments</p>
              </div>
              <div className="text-center">
                <FiCalendar className="mx-auto text-zinc-500 dark:text-zinc-400 mb-2" size={24} />
                <p className="text-zinc-600 dark:text-zinc-400">Joined</p>
              </div>
            </div>
          </div>

          {/* Liked Posts */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Liked Posts</h2>
            {likedPosts.length > 0 ? (
              <div className="space-y-4">
                {likedPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100">{post.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">No liked posts available.</p>
            )}
          </div>

          {/* Commented Posts */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Commented Posts</h2>
            {commentedPosts.length > 0 ? (
              <div className="space-y-4">
                {commentedPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100">{post.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">No commented posts available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
