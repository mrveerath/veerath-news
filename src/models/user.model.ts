import { Schema, model, Document } from "mongoose";

// TypeScript interface for authentication providers
interface IAuthProvider {
  provider: string; // e.g., "email", "google", "twitter", "github"
  providerId?: string; // Unique ID from the provider
  email?: string; // Email associated with the provider
  verified: boolean; // Verification status
  lastUsedAt?: Date; // When the provider was last used for sign-in
}

// TypeScript interface for User
export interface IUser extends Document {
  clerkId: string;
  username?: string;
  fullName?: string;
  emailAddresses: {
    email: string;
    verified: boolean;
    primary: boolean;
  }[];
  profileImageUrl?: string;
  authProviders: IAuthProvider[];
  lastSignInAt?: Date;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: [true, "Clerk user ID is required"],
      unique: true,
      trim: true,
      match: [/^user_[a-zA-Z0-9-_]+$/, "Invalid Clerk user ID format"],
      index: true,
    },
    username: {
      type: String,
      trim: true,
      maxlength: [50, "Username cannot exceed 50 characters"],
      match: [/^[a-zA-Z0-9_-]+$/, "Invalid username format"],
      sparse: true,
      default: null,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
      default: null,
    },
    emailAddresses: [
      {
        email: {
          type: String,
          required: [true, "Email address is required"],
          trim: true,
          lowercase: true,
          match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
        },
        verified: {
          type: Boolean,
          default: false,
        },
        primary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    profileImageUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Invalid URL format"],
      default: null,
    },
    authProviders: [
      {
        provider: {
          type: String,
          required: [true, "Auth provider type is required"],
          enum: ["email", "google", "twitter", "github"],
        },
        providerId: {
          type: String,
          trim: true,
          default: null,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
          match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
          default: null,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        lastUsedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    lastSignInAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ clerkId: 1 }, { unique: true });
userSchema.index({ "emailAddresses.email": 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ "authProviders.provider": 1, "authProviders.providerId": 1 });

// Prevent multiple primary email addresses
userSchema.pre<IUser>("save", function (next) {
  const primaryEmails = this.emailAddresses.filter((email) => email.primary);
  if (primaryEmails.length > 1) {
    throw new Error("Only one email address can be marked as primary");
  }
  next();
});

// Export the User model
export const User = model<IUser>("User", userSchema);
