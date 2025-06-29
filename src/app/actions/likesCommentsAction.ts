"use server"
import { dbConnect } from "@/lib/dbConnect";
import { Blog } from "@/models/blog.model";
import { Comment } from "@/models/comment.model";
import User from "@/models/user.model";
import { Types } from "mongoose";

// Define the API response interface
interface ApiResponse<T> {
  success: boolean;
  error?: boolean;
  data: T | null;
  message: string;
}
// Define the structure for liked posts
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
// Define the structure for commented posts
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
// Define the structure for comment data Of comment
interface CommentData {
  comment: string;
  commentedBy: string;
  blogId: string;
}
// Define the structure for the single comment
export interface BlogComments {
  commentId: string;
  createdBy: {
    fullName: string;
    id: string;
    profileImage: string;
  };
  content: string;
  likes: number;
  likedBy: string[]
  createdAt: Date
}
// Function to fetch liked posts
export async function getLikedPosts(userId: string): Promise<ApiResponse<LikedPosts[]>> {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid User ID format",
      };
    }

    const likedPosts = await Blog.find({
      likedBy: { $in: [userId] }
    }).populate<{ createdBy: { fullName: string; profileImage: string; _id: Types.ObjectId } }>(
      'createdBy',
      'fullName profileImage _id'
    );

    const posts = likedPosts.map((post) => ({
      id: String(post._id),
      title: post.title,
      excerpt: post.excerpt,
      thumbnailUrl: post.thumbnailUrl,
      createdBy: {
        fullName: post.createdBy.fullName,
        profileImage: post.createdBy.profileImage,
        id: String(post.createdBy._id),
      }
    }));

    return {
      success: true,
      message: "Blogs fetched successfully",
      data: posts,
    };
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    return {
      success: false,
      error: true,
      message: "Failed to fetch blogs",
      data: null,
    };
  }
}
// Function to like and unlike the post
export async function toggleLikeToPost(userId: string, blogId: string): Promise<ApiResponse<string>> {
  try {
    await dbConnect();

    // Validate userId and blogId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(blogId)) {
      return {
        success: false,
        error: true,
        data: "Unliked",
        message: "Invalid User ID or Blog ID format",
      };
    }

    // Find the blog by ID
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return {
        success: false,
        error: true,
        data: "Unliked",
        message: "Blog Doesn't Exist",
      };
    }

    // Check if the userId is already in the likedBy array
    const index = existingBlog.likedBy.indexOf(userId);
    if (index !== -1) {
      // If userId is found, remove it (unlike)
      existingBlog.likedBy.splice(index, 1);
      await existingBlog.save();
      console.log("Post unliked by user:", userId);
      return {
        success: true,
        error: false,
        message: "Like Removed Successfully",
        data: userId,
      };
    } else {
      // If userId is not found, add it (like)
      existingBlog.likedBy.push(userId);
      await existingBlog.save();
      console.log("Post liked by user:", userId);
      return {
        success: true,
        error: false,
        message: "Post Liked Successfully",
        data: userId,
      };
    }
  } catch (error) {
    console.error("Error in toggleLikeToPost:", error);
    return {
      success: false,
      error: true,
      message: "Failed to toggle like the blog",
      data: null,
    };
  }
}
// function to save and unsave the post
export async function toggleSavePost(userId: string, blogId: string): Promise<ApiResponse<string>> {
  try {
    await dbConnect();

    // Validate userId and blogId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(blogId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid User ID or Blog ID format",
      };
    }

    // Find the user by ID
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return {
        success: false,
        error: true,
        data: "Unsaved",
        message: "User Doesn't Exist",
      };
    }

    // Check if the blogId is already in the savedPost array
    const index = existingUser.savedPost.indexOf(blogId);
    if (index !== -1) {
      // If blogId is found, remove it
      existingUser.savedPost.splice(index, 1);
      await existingUser.save();
      return {
        success: true,
        error: false,
        message: "Post Unsaved Successfully",
        data: "Unsaved",
      };
    } else {
      // If blogId is not found, add it
      existingUser.savedPost.push(blogId);
      await existingUser.save();
      return {
        success: true,
        error: false,
        message: "Post Saved Successfully",
        data: "Saved",
      };
    }
  } catch (error) {
    console.error("Error in toggleSavePost:", error);
    return {
      success: false,
      error: true,
      message: "Failed to toggle save the blog",
      data: "Unsaved",
    };
  }
}
// Function to add comments
export async function addComments(commentData: CommentData): Promise<ApiResponse<BlogComments>> {
  try {
    const { blogId, comment, commentedBy } = commentData;
    await dbConnect();

    if (!Types.ObjectId.isValid(commentedBy) || !Types.ObjectId.isValid(blogId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid User ID or Blog ID format",
      };
    }

    const newComment = new Comment({
      postId: blogId,
      createdBy: commentedBy,
      content: comment
    });
    const user = await User.findById(commentedBy);

    await newComment.save();

    const dataToReturn = {
      commentId: String(newComment._id),
      createdBy: {
        fullName: user.fullName,
        id: String(user._id),
        profileImage: user.profileImage
      },
      content: newComment.content,
      likes: 0,
      likedBy: [],
      createdAt: newComment.createdAt
    };

    return {
      success: true,
      error: false,
      data: dataToReturn as BlogComments,
      message: "Comment Added Successfully",
    };
  } catch (error) {
    console.error("Error adding comment:", error);
    return {
      success: false,
      error: true,
      data: null,
      message: "Failed to add the comment",
    };
  }
}
// Function to check is post is saved or not
export async function checkIsSaved(userId: string, blogId: string): Promise<ApiResponse<string>> {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(blogId) || !Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: true,
        data: 'Unsaved',
        message: "Invalid Blog ID Or UserId format",
      };
    }

    const existingUser = await User.findById(userId);
    const isSaved = existingUser?.savedPost.includes(blogId)
    return {
      success: true,
      error: false,
      data: isSaved ? "Saved" : "Unsaved",
      message: "",
    };
  } catch (error) {
    console.error("Error checking if post is saved:", error);
    return {
      success: false,
      error: true,
      data: "Unsaved",
      message: "Failed to check if the post is saved",
    };
  }
}
// Function to fetch all comments for a post
export async function getAllComments(postId: string): Promise<ApiResponse<BlogComments[]>> {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(postId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid Blog ID format",
      };
    }

    const allComments = await Comment.find({ postId })
      .populate<{ createdBy: { fullName: string; profileImage: string; _id: Types.ObjectId } }>(
        'createdBy',
        'fullName profileImage _id'
      );

    const comments = allComments.map((comment) => ({
      commentId: String(comment._id),
      createdBy: {
        fullName: comment.createdBy.fullName,
        id: String(comment.createdBy._id),
        profileImage: comment.createdBy.profileImage,
      },
      content: comment.content,
      likes: comment.likedBy?.length || 0,
      likedBy: comment.likedBy || [],
      createdAt: comment.createdAt
    }));

    return {
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return {
      success: false,
      error: true,
      message: "Failed to fetch comments",
      data: null,
    };
  }
}
// Function to fetch commented posts
export async function getCommentedPosts(userId: string): Promise<ApiResponse<CommentedPosts[]>> {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid User ID format",
      };
    }

    const comments = await Comment.find({
      createdBy: userId
    }).populate<{
      postId: {
        title: string;
        excerpt: string;
        thumbnailUrl: string;
        _id: Types.ObjectId;
        createdBy: {
          fullName: string;
          profileImage: string;
          _id: Types.ObjectId;
        };
      }
    }>({
      path: 'postId',
      select: 'title excerpt thumbnailUrl createdBy'
    });

    const commentedPosts = comments.map((comment) => ({
      id: String(comment.postId._id),
      commentId: String(comment._id),
      title: comment.postId.title,
      excerpt: comment.postId.excerpt,
      thumbnailUrl: comment.postId.thumbnailUrl,
      createdBy: {
        fullName: comment.postId.createdBy.fullName,
        profileImage: comment.postId.createdBy.profileImage,
        id: String(comment.postId.createdBy._id),
      }
    }));

    return {
      success: true,
      message: "Commented posts fetched successfully",
      data: commentedPosts,
    };
  } catch (error) {
    console.error("Error fetching commented posts:", error);
    return {
      success: false,
      error: true,
      message: "Failed to fetch commented posts",
      data: null,
    };
  }
}
// Function to toggle like on a comment
export async function toggleCommentLike(commentId: string, userId: string): Promise<ApiResponse<BlogComments>> {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(commentId) || !Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid Comment ID or User ID format",
      };
    }

    const comment = await Comment.findById(commentId).populate<{
      createdBy: { fullName: string; profileImage: string; _id: Types.ObjectId }
    }>('createdBy', 'fullName profileImage _id');

    if (!comment) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Comment not found",
      };
    }

    const userIndex = comment.likedBy?.indexOf(new Types.ObjectId(userId)) ?? -1;
    let likes = comment.likedBy?.length || 0;

    if (userIndex === -1) {
      comment.likedBy = comment.likedBy || [];
      comment.likedBy.push(new Types.ObjectId(userId));
      likes += 1;
    } else {
      comment.likedBy.splice(userIndex, 1);
      likes -= 1;
    }

    await comment.save();

    const dataToReturn = {
      commentId: String(comment._id),
      createdBy: {
        fullName: comment.createdBy.fullName,
        id: String(comment.createdBy._id),
        profileImage: comment.createdBy.profileImage,
      },
      content: comment.content,
      likes,
      likedBy: comment.likedBy as string[],
      createdAt: comment.createdAt
    };

    return {
      success: true,
      message: userIndex === -1 ? "Comment liked successfully" : "Comment unliked successfully",
      data: dataToReturn,
    };
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return {
      success: false,
      error: true,
      message: "Failed to toggle comment like",
      data: null,
    };
  }
}
// Function to delete a comment
export async function deleteComment(commentId: string, userId: string): Promise<ApiResponse<null>> {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(commentId) || !Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Invalid Comment ID or User ID format",
      };
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Comment not found",
      };
    }

    if (String(comment.createdBy) !== userId) {
      return {
        success: false,
        error: true,
        data: null,
        message: "Unauthorized: You can only delete your own comments",
      };
    }

    await Comment.deleteOne({ _id: commentId });

    return {
      success: true,
      message: "Comment deleted successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      error: true,
      message: "Failed to delete comment",
      data: null,
    };
  }
}