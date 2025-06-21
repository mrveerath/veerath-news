import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import User from "@/models/user.model";
import { dbConnect } from "@/lib/dbConnect";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// GET: Fetch user details
export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
): Promise<NextResponse> {
  const { userId } = context.params;

  if (!userId || !Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid User ID", data: null },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const user = await User.findById(userId).select(
      "_id userName email profileImage fullName interests"
    );

    if (!user || user.isDeleted) {
      return NextResponse.json(
        { success: false, message: "User not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "User retrieved successfully", data: user },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_USER_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(
  request: NextRequest,
  context: { params: { userId: string } }
): Promise<NextResponse> {
  const { userId } = context.params;

  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid User ID", data: null },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON", data: null },
      { status: 400 }
    );
  }

  const { userName, fullName, email, profileImage } = body;

  if (!userName || !email || !fullName) {
    return NextResponse.json(
      {
        success: false,
        message: "userName, email, and fullName are required",
        data: null,
      },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const existingUser = await User.findOne({
      $or: [{ userName }, { email }],
      _id: { $ne: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Username or Email already in use",
          data: null,
        },
        { status: 409 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      {
        $set: {
          userName,
          email,
          fullName,
          profileImage: profileImage || null,
        },
      },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH_USER_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}

// POST: Update user password
export async function POST(
  request: NextRequest,
  context: { params: { userId: string } }
): Promise<NextResponse> {
  const { userId } = context.params;

  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid User ID", data: null },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON", data: null },
      { status: 400 }
    );
  }

  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    return NextResponse.json(
      {
        success: false,
        message: "Both old and new passwords are required",
        data: null,
      },
      { status: 400 }
    );
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        data: null,
      },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found", data: null },
        { status: 404 }
      );
    }

    const isPasswordCorrect = await user.validatePassword(oldPassword);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: "Incorrect old password", data: null },
        { status: 401 }
      );
    }

    const isSamePassword = await user.validatePassword(newPassword);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be the same as old password",
          data: null,
        },
        { status: 400 }
      );
    }

    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}
