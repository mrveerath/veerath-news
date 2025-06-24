"use server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/user.model";

// Interface for the complete user response (excluding sensitive fields)
interface UserResponse {
    _id: Types.ObjectId;
    userName: string;
    email: string;
    profileImage?: string | null;
    fullName: string;
    interests: string[];
    bio:string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Interface for updateable user details
interface UserDetails {
    userName: string;
    email: string;
    profileImage?: string;
    fullName: string;
    bio:string
}

// Interface for password change
interface Passwords {
    oldPassword: string;
    newPassword: string;
}

// Standard response interface
interface ApiResponse<T> {
    success: boolean;
    error?: boolean;
    data: T | null;
    message: string;
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

// Password complexity regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Fetches user details by ID
 * @param userId - The user's MongoDB ObjectId
 * @returns ApiResponse with either UserResponse or error message
 */
export async function getUserDetails(
    userId: string
): Promise<ApiResponse<UserResponse>> {
    await dbConnect();
    try {
        if (!Types.ObjectId.isValid(userId)) {
            return {
                success: false,
                error: true,
                data: null,
                message: "Invalid User ID format",
            };
        }

        const user = await User.findById(userId).select("-password -__v");

        if (!user || user.isDeleted) {
            return {
                success: false,
                error: true,
                data: null,
                message: "User not found",
            };
        }

        const userData: UserResponse = {
            _id: String(user._id),
            userName: user.userName,
            email: user.email,
            profileImage: user.profileImage || null,
            fullName: user.fullName,
            interests: user.interests || [],
            ...(user.createdAt && { createdAt: user.createdAt }),
            ...(user.updatedAt && { updatedAt: user.updatedAt }),
        };

        return {
            success: true,
            error: false,
            data: userData,
            message: "User details fetched successfully",
        };
    } catch (error) {
        console.error("[USER_GET_ERROR]", error);
        return {
            success: false,
            error: true,
            data: null,
            message: "An error occurred while fetching user details",
        };
    }
}

/**
 * Updates user details
 * @param userId - The user's MongoDB ObjectId
 * @param userDetails - Object containing updatable user fields
 * @returns ApiResponse with either updated UserResponse or error message
 */
export async function updateUserDetails(
    userId: string,
    userDetails: UserDetails
): Promise<ApiResponse<UserResponse>> {
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

        if (!userDetails || !userDetails.userName || !userDetails.email || !userDetails.fullName) {
            return {
                success: false,
                error: true,
                data: null,
                message: "All required fields must be provided",
            };
        }

        const existingUser = await User.findOne({
            $or: [
                { userName: userDetails.userName },
                { email: userDetails.email },
            ],
            _id: { $ne: new Types.ObjectId(userId) },
        });

        if (existingUser) {
            return {
                success: false,
                error: true,
                data: null,
                message: existingUser.userName === userDetails.userName
                    ? "Username already in use"
                    : "Email already in use",
            };
        }

        const updateData = {
            userName: userDetails.userName,
            email: userDetails.email,
            profileImage: userDetails.profileImage || null,
            fullName: userDetails.fullName,
        };

        const user = await User.findOneAndUpdate(
            { _id: userId, isDeleted: false },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password -__v");

        if (!user) {
            return {
                success: false,
                error: true,
                data: null,
                message: "User not found or has been deleted",
            };
        }

        const updatedUser: UserResponse = {
            _id: String(user._id),
            userName: user.userName,
            email: user.email,
            profileImage: user.profileImage || null,
            fullName: user.fullName,
            interests: user.interests || [],
            ...(user.createdAt && { createdAt: user.createdAt }),
            ...(user.updatedAt && { updatedAt: user.updatedAt }),
        };

        return {
            success: true,
            error: false,
            data: updatedUser,
            message: "User details updated successfully",
        };
    } catch (error) {
        console.error("[USER_UPDATE_ERROR]", error);
        return {
            success: false,
            error: true,
            data: null,
            message: "An error occurred while updating user details",
        };
    }
}

export async function getCompleteUserDetails(userId: string): Promise<ApiResponse<CompleteUserDetails>> {
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
        const userDetails = await User.findById(userId).select("-password")
        const userToReturn = {
            userName: userDetails.userName,
            email: userDetails.email,
            profileImage: userDetails.profileImage,
            fullName: userDetails.fullName,
            bio: userDetails.bio,
            savedPost: userDetails.savedPost,
            interests: userDetails.interests,
        }

        return {
            success: true,
            error: false,
            data: userToReturn,
            message: "User Details Fetched Successfully",
        };
    } catch (error) {
        return {
            success: false,
            error: true,
            data: null,
            message: "An error occurred while updating user details",
        };
    }

}

/**
 * Updates user password
 * @param userId - The user's MongoDB ObjectId
 * @param passwords - Object containing old and new passwords
 * @returns ApiResponse with success message or error
 */
export async function updateUserPassword(
    userId: string,
    passwords: Passwords
): Promise<ApiResponse<string>> {
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

        if (!passwords?.oldPassword || !passwords?.newPassword) {
            return {
                success: false,
                error: true,
                data: null,
                message: "Both old and new passwords are required",
            };
        }

        if (!PASSWORD_REGEX.test(passwords.newPassword)) {
            return {
                success: false,
                error: true,
                data: null,
                message: "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character",
            };
        }

        const existingUser = await User.findById(userId).select("+password");
        if (!existingUser) {
            return {
                success: false,
                error: true,
                data: null,
                message: "User not found",
            };
        }

        const isPasswordCorrect = await existingUser.validatePassword(passwords.oldPassword);
        if (!isPasswordCorrect) {
            return {
                success: false,
                error: true,
                data: null,
                message: "Incorrect old password",
            };
        }

        const isSamePassword = await existingUser.validatePassword(passwords.newPassword);
        if (isSamePassword) {
            return {
                success: false,
                error: true,
                data: null,
                message: "New password cannot be the same as old password",
            };
        }

        existingUser.password = passwords.newPassword;
        await existingUser.save({ validateBeforeSave: true });

        return {
            success: true,
            error: false,
            data: null,
            message: "Password updated successfully",
        };
    } catch (error) {
        console.error("[PASSWORD_UPDATE_ERROR]", error);
        return {
            success: false,
            error: true,
            data: null,
            message: "An error occurred while updating password",
        };
    }
}

// Type exports for external use
export type { UserResponse, UserDetails, ApiResponse };
