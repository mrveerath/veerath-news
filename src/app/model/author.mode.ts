import { Schema, model } from "mongoose";

// TypeScript interface for User
export interface IUser {
  clerkId: string;
  username?: string;
  fullName?: string;
  emailAddress: string;
  imageUrl?: string;
  publicMetadata: Record<string, any>;
  unsafeMetadata: Record<string, any>;
  lastSignInAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: [true, "Clerk user ID is required"],
      unique: true,
      trim: true,
      match: [/^[a-zA-Z0-9-_]+$/, "Invalid Clerk user ID format"], // Matches Clerk's user ID format
      index: true,
    },
    username: {
      type: String,
      trim: true,
      maxlength: [50, "Username cannot exceed 50 characters"],
      default: null,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
      default: null,
    },
    emailAddress: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Invalid URL format"],
      default: null,
    },
    publicMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    unsafeMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastSignInAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null, // For soft deletion
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ clerkId: 1 }, { unique: true });
userSchema.index({ emailAddress: 1 });
userSchema.index({ deletedAt: 1 });

// Pre-save hook to normalize data
userSchema.pre("save", function (next) {
  // Ensure metadata fields are objects
  if (!this.publicMetadata) this.publicMetadata = {};
  if (!this.unsafeMetadata) this.unsafeMetadata = {};
  next();
});

// Handle unique clerkId errors
userSchema.post("save", function (error: any, doc: any, next: any) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Clerk user ID must be unique"));
  } else {
    next(error);
  }
});

export const User = model<IUser>("User", userSchema);