"use server";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/user.model";
import { Blog } from "@/models/blog.model";
import { Comment } from "@/models/comment.model";
import { Image } from "@/models/image.model";

// Reusable API Response Interface
interface ApiResponse<T> {
    success: boolean;
    error?: boolean;
    data: T | null;
    message: string;
}

// Interfaces for user data
export interface UserResponse {
    _id: string;
    userName: string;
    email: string;
    profileImage?: string | null;
    fullName: string;
    interests: string[];
    bio: string;
    profession: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CompleteUserDetails {
    userName: string;
    email: string;
    profileImage: string;
    fullName: string;
    bio: string;
    savedPost: string[];
    interests: string[];
}

export interface UserDetails {
    userName: string;
    email: string;
    profileImage?: string;
    fullName: string;
    bio: string;
    profession: string;
}

export interface Passwords {
    oldPassword: string;
    newPassword: string;
}

// Regex for password complexity
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/** Fetches sanitized user details by ID */
export async function getUserDetails(userId: string): Promise<ApiResponse<UserResponse>> {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
        return { success: false, error: true, data: null, message: "Invalid User ID format" };
    }

    const user = await User.findById(userId).select("-password -__v");
    if (!user || user.isDeleted) {
        return { success: false, error: true, data: null, message: "User not found" };
    }

    const userData: UserResponse = {
        _id: user._id.toString(),
        userName: user.userName,
        email: user.email,
        profileImage: user.profileImage || null,
        fullName: user.fullName,
        interests: user.interests || [],
        bio: user.bio,
        profession: user.profession,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

    return { success: true, error: false, data: userData, message: "User details fetched successfully" };
}

/** Updates a user’s profile details */
export async function updateUserDetails(userId: string, userDetails: UserDetails): Promise<ApiResponse<UserResponse>> {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
        return { success: false, error: true, data: null, message: "Invalid User ID format" };
    }

    const { userName, email, fullName, bio, profession, profileImage } = userDetails;
    if (!userName || !email || !fullName) {
        return { success: false, error: true, data: null, message: "Missing required fields" };
    }

    const existingUser = await User.findOne({
        $or: [{ userName }, { email }],
        _id: { $ne: userId },
    });

    if (existingUser) {
        return {
            success: false,
            error: true,
            data: null,
            message: existingUser.userName === userName ? "Username already in use" : "Email already in use",
        };
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, isDeleted: false },
        {
            $set: {
                userName,
                email,
                fullName,
                bio,
                profession,
                profileImage: profileImage || null,
            },
        },
        { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) {
        return { success: false, error: true, data: null, message: "User not found or deleted" };
    }

    return {
        success: true,
        error: false,
        data: {
            _id: updatedUser._id.toString(),
            userName: updatedUser.userName,
            email: updatedUser.email,
            profileImage: updatedUser.profileImage,
            fullName: updatedUser.fullName,
            interests: updatedUser.interests,
            bio: updatedUser.bio,
            profession: updatedUser.profession,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        },
        message: "User details updated successfully",
    };
}

/** Fetches extended user profile including saved posts */
export async function getCompleteUserDetails(userId: string): Promise<ApiResponse<CompleteUserDetails>> {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
        return { success: false, error: true, data: null, message: "Invalid User ID format" };
    }

    const user = await User.findById(userId).select("-password");
    if (!user || user.isDeleted) {
        return { success: false, error: true, data: null, message: "User not found" };
    }

    return {
        success: true,
        error: false,
        data: {
            userName: user.userName,
            email: user.email,
            profileImage: user.profileImage,
            fullName: user.fullName,
            bio: user.bio,
            savedPost: user.savedPost || [],
            interests: user.interests || [],
        },
        message: "User details fetched successfully",
    };
}

/** Soft-deletes a user account and associated data */
export async function deleteUserAccount(userId: string): Promise<ApiResponse<boolean>> {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
        return { success: false, error: true, data: null, message: "Invalid User ID format" };
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
        return { success: false, error: true, data: null, message: "User not found" };
    }

    try {
        await Promise.all([
            Blog.deleteMany({ createdBy: userId }),
            Comment.deleteMany({ createdBy: userId }),
            Image.deleteMany({ uploadedBy: userId }),
        ]);

        user.isDeleted = true;
        await user.save();

        return { success: true, error: false, data: true, message: "User deleted successfully" };
    } catch (err) {
        console.log(err)
        console.error("[DELETE_USER_ERROR]", err);
        return { success: false, error: true, data: false, message: "Failed to delete user data" };
    }
}

/** Updates user password with complexity and safety checks */
export async function updateUserPassword(userId: string, passwords: Passwords): Promise<ApiResponse<string>> {
    await dbConnect();

    if (!Types.ObjectId.isValid(userId)) {
        return { success: false, error: true, data: null, message: "Invalid User ID format" };
    }

    const { oldPassword, newPassword } = passwords;
    if (!oldPassword || !newPassword) {
        return { success: false, error: true, data: null, message: "Old and new passwords are required" };
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
        return {
            success: false,
            error: true,
            data: null,
            message: "Password must be 8+ characters and include uppercase, lowercase, number, and special character",
        };
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
        return { success: false, error: true, data: null, message: "User not found" };
    }

    const isOldCorrect = await user.validatePassword(oldPassword);
    if (!isOldCorrect) {
        return { success: false, error: true, data: null, message: "Incorrect old password" };
    }

    const isSame = await user.validatePassword(newPassword);
    if (isSame) {
        return { success: false, error: true, data: null, message: "New password cannot be same as old password" };
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return { success: true, error: false, data: null, message: "Password updated successfully" };
}

// Exporting type definitions for external use
export type { ApiResponse };
