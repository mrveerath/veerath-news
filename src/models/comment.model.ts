import { Schema, model, Types, models } from "mongoose";

// TypeScript interface for Comment
export interface IComment {
    postId: Types.ObjectId;
    createdBy: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    likes: Types.ObjectId[]
}

const commentSchema = new Schema<IComment>(
    {
        postId: {
            type: Schema.Types.ObjectId,
            ref: "Blog",
            required: [true, "Post ID is required"],
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Post ID is required"],
            index: true,
        },
        content: {
            type: String,
            required: [true, "Comment content is required"],
            trim: true,
            minlength: [1, "Comment cannot be empty"],
            maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for performance
commentSchema.index({ postId: 1, createdAt: -1 }); // For fetching comments by post
commentSchema.index({ deletedAt: 1 }); // For soft deletion queries

// Validate postId exists in BlogPost
commentSchema.pre("save", async function (next) {
    if (this.isNew || this.isModified("postId")) {
        const BlogPost = model("Blog");
        const post = await BlogPost.findOne({ _id: this.postId, deletedAt: null });
        if (!post) {
            return next(new Error("Invalid post ID: Post does not exist or is deleted"));
        }
    }
    next();
});

// Update BlogPost commentCount on save
commentSchema.post("save", async function (doc) {
    const BlogPost = model("Blog");
    await BlogPost.updateOne(
        { _id: doc.postId, deletedAt: null },
        { $set: { commentCount: await model("Comment").countDocuments({ postId: doc.postId, deletedAt: null }) } }
    );
});


export const Comment = models.Comment || model<IComment>("Comment", commentSchema);