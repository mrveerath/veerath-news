import { Schema, model, Types, models } from "mongoose";

// TypeScript interface for the Blog
export interface I_Blog {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    thumbnailUrl: string;
    metaTitle: string;
    metaDescription: string;
    tags: string[];
    isPublished: boolean;
    publishedAt?: Date | null;
    likedBy: Types.ObjectId[];
    comments: Types.ObjectId[];
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy: Types.ObjectId
    readedBy: Types.ObjectId[]
}

const blogSchema = new Schema<I_Blog>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [100, "Title must be 100 characters or less"],
        },
        slug: {
            type: String,
            required: [true, "Slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9-]+$/, "Slug must be URL-friendly (alphanumeric and hyphens)"],
            minlength: [3, "Slug must be at least 3 characters"],
            maxlength: [100, "Slug must be 100 characters or less"],
            index:true
        },
        excerpt: {
            type: String,
            required: [true, "Excerpt is required"],
            trim: true,
            minlength: [10, "Excerpt must be at least 10 characters"],
            maxlength: [200, "Excerpt must be 200 characters or less"],
        },
        content: {
            type: String,
            required: [true, "Content is required"],
            minlength: [50, "Content must be at least 50 characters"],
        },
        thumbnailUrl: {
            type: String,
            required: [true, "Thumbnail URL is required"],
            trim: true,
            match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Thumbnail URL must be a valid URL"],
        },
        metaTitle: {
            type: String,
            required: [true, "Meta title is required"],
            trim: true,
            maxlength: [60, "Meta title must be 60 characters or less"],
        },
        metaDescription: {
            type: String,
            required: [true, "Meta description is required"],
            trim: true,
            maxlength: [160, "Meta description must be 160 characters or less"],
        },
        tags: {
            type: [String],
            default: [],
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date,
            default: null,
        },
        likedBy: [{
            type: Types.ObjectId,
            ref: "User",
            default: [],
        }],
        comments: [{
            type: Types.ObjectId,
            ref: "Comment",
            default: [],
        }],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        ]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


// Prevent indexing deleted documents
blogSchema.index({ isDeleted: 1 });

blogSchema.pre<I_Blog>('save', function (next) {
    if (this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

export const Blog = models.Blog || model<I_Blog>("Blog", blogSchema);

