"use server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/user.model";

// Interface for the complete user response (excluding sensitive fields)
interface UserResponse {
    _id: Types.ObjectId;
    userName: string;
    email: string;
    profileImage?: string | null;
    fullName: string;
    interests: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

// Interface for updateable user details
interface UserDetails {
    userName: string;
    email: string;
    profileImage?: string;
    fullName: string;
}

// Interface for password change
interface Passwords {
    oldPassword: string;
    newPassword: string;
}

// Standard response interface
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
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
): Promise<ApiResponse<UserResponse | string>> {
    await dbConnect();
    console.log("Getting User Details...")
    try {

        // Validate userId format
        if (!Types.ObjectId.isValid(userId)) {
            return {
                success: false,
                data: "Invalid User ID format",
            };
        }

        const user = await User.findById(userId).select("-password -__v");

        if (!user || user.isDeleted) {
            return {
                success: false,
                data: "User not found",
            };
        }

        // Convert Mongoose document to plain object
        const userData: UserResponse = {
            _id: user._id,
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
            data: userData,
        };
    } catch (error) {
        console.error("[USER_GET_ERROR]", error);
        return {
            success: false,
            data: "An error occurred while fetching user details",
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
): Promise<ApiResponse<UserResponse | string>> {
    try {
        await dbConnect();

        // Validate userId format
        if (!Types.ObjectId.isValid(userId)) {
            return {
                success: false,
                data: "Invalid User ID format",
            };
        }

        // Validate input
        if (!userDetails || !userDetails.userName || !userDetails.email || !userDetails.fullName) {
            return {
                success: false,
                data: "All required fields must be provided",
            };
        }

        // Check for duplicate username or email
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
                data: existingUser.userName === userDetails.userName
                    ? "Username already in use"
                    : "Email already in use",
            };
        }

        // Prepare update data
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
                data: "User not found or has been deleted",
            };
        }

        // Convert Mongoose document to plain object
        const updatedUser: UserResponse = {
            _id: user._id,
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
            data: updatedUser,
        };
    } catch (error) {
        console.error("[USER_UPDATE_ERROR]", error);
        return {
            success: false,
            data: "An error occurred while updating user details",
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

        // Validate userId format
        if (!Types.ObjectId.isValid(userId)) {
            return {
                success: false,
                data: "Invalid User ID format",
            };
        }

        // Validate passwords object
        if (!passwords?.oldPassword || !passwords?.newPassword) {
            return {
                success: false,
                data: "Both old and new passwords are required",
            };
        }

        // Check password complexity
        if (!PASSWORD_REGEX.test(passwords.newPassword)) {
            return {
                success: false,
                data: "Password must contain at least 8 characters, including uppercase, lowercase, number and special character",
            };
        }

        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return {
                success: false,
                data: "User not found",
            };
        }

        // Verify old password
        const isPasswordCorrect = await existingUser.validatePassword(passwords.oldPassword);
        if (!isPasswordCorrect) {
            return {
                success: false,
                data: "Incorrect old password",
            };
        }

        // Check if new password is same as old
        const isSamePassword = await existingUser.validatePassword(passwords.newPassword);
        if (isSamePassword) {
            return {
                success: false,
                data: "New password cannot be the same as old password",
            };
        }

        // Set the new password (will be hashed by the pre-save hook)
        existingUser.password = passwords.newPassword;
        await existingUser.save({ validateBeforeSave: true });

        return {
            success: true,
            data: "Password updated successfully",
        };
    } catch (error) {
        console.error("[PASSWORD_UPDATE_ERROR]", error);
        return {
            success: false,
            data: "An error occurred while updating password",
        };
    }
}

// Type exports for external use
export type { UserResponse, UserDetails, ApiResponse };