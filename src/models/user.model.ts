// src/models/user.model.ts
import { Schema, model, models, Types, Document, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  profileImage?: string;
  fullName: string;
  bio?: string;
  savedPost: Types.ObjectId[];
  interests: string[];
  isDeleted?: boolean;
  profession: string;
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
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [50, 'Full name must be 50 characters or less'],
    },
    profession: {
      type: String,
      trim: true,
      minlength: [2, 'Profession must be at least 2 characters'],
      maxlength: [50, 'Profession must be 50 characters or less'],
    },
    bio: {
      type: String,
      trim: true,
      minlength: [10, 'Bio must be at least 10 characters'], // adjusted from 82 for usability
      maxlength: [500, 'Bio must be 500 characters or less'],
    },
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
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Password hashing middleware
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as CallbackError);
  }
});

// Instance method for password validation
userSchema.methods.validatePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Password validation error:', err);
    return false;
  }
};

// Export the model
const User = models.User || model<IUser>('User', userSchema);
export default User;
