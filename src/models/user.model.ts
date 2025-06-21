// src/models/user.model.ts
import { Schema, model, models, Types, Document, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs'


export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  profileImage?: string;
  fullName: string;
  likedPosts: Types.ObjectId[];
  commentedPost: Types.ObjectId[];
  savedPost: Types.ObjectId[];
  interests: string[];
  isDeleted?: boolean;
  validatePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]{3,20}$/, 'Username must be 3-20 alphanumeric characters or underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^@]+@[^@]+\.[^@]+$/, 'Email must be a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    profileImage: {
      type: String,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Profile image must be a valid URL'],
      default: null,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [50, 'Full name must be 50 characters or less'],
    },
    likedPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
        default: [],
      },
    ],
    commentedPost: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
        default: [],
      },
    ],
    savedPost: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
        default: [],
      },
    ],
    interests: {
      type: [String],
      default: [],
      validate: {
        validator: (interests: string[]) =>
          interests.every((interest) => /^[a-zA-Z0-9-]{1,30}$/.test(interest)),
        message: 'Interests must be alphanumeric or hyphens, 1-30 characters each',
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as CallbackError );
  }
});

userSchema.methods.validatePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Password validation error:', err);
    return false;
  }
};

const User =models.User || model<IUser>('User', userSchema);

export default User;