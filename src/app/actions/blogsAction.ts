'use server'

import { Blog } from "@/models/blog.model";
import { BlogData } from "../create-blog/page";
import { dbConnect } from "@/lib/dbConnect";
import { Types } from "mongoose";

interface ApiResponse<T> {
    success: boolean;
    error?: boolean;
    message: string;
    data?: T;
}

export async function getBlogs(userId: string): Promise<ApiResponse<any>> {
    try {
        await dbConnect()

        const blogs = await Blog.find({ 
            createdBy: userId,
            isDeleted: false 
        })
        .select("+title excerpt thumbnailUrl tags createdBy")
        .populate({
            path: 'createdBy',
            select: 'fullName thumbnailUrl _id',
        })
        .sort({ createdAt: -1 })
        .lean();

        return {
            success: true,
            message: "Blogs fetched successfully",
            data: blogs
        };

    } catch (error) {
        console.error("Error fetching blogs:", error);
        return {
            success: false,
            error: true,
            message: "Failed to fetch blogs",
        };
    }
}

export async function createBlog(blogData: BlogData): Promise<ApiResponse<any>> {
    try {
        await dbConnect()

        const {
            content, excerpt, isPublished,
            metaDescription, metaTitle,
            slug, tags,
            thumbnailUrl, title, userId
        } = blogData;

        // Validate required fields
        if (!content || !excerpt || !metaDescription || !metaTitle || 
            !slug || !thumbnailUrl || !title || !userId) {
            return {
                success: false,
                error: true,
                message: "All required fields must be provided",
            };
        }

        // Check if slug already exists
        const existingBlog = await Blog.findOne({ slug, isDeleted: false });
        if (existingBlog) {
            return {
                success: false,
                error: true,
                message: "Blog with this slug already exists",
            };
        }

        const newBlog = new Blog({
            content,
            excerpt,
            isPublished,
            metaDescription,
            metaTitle,
            slug,
            tags: tags || [],
            thumbnailUrl,
            title,
            createdBy: userId,
            publishedAt: isPublished ? new Date() : null
        });

        await newBlog.save();

        // Populate creator info in the response
        const createdBlog = await Blog.findById(newBlog._id)
            .populate({
                path: 'createdBy',
                select: 'fullName thumbnailUrl _id',
            })
            .lean();

        return {
            success: true,
            message: "Blog created successfully",
            data: createdBlog
        };

    } catch (error) {
        console.error("Error creating blog:", error);
        return {
            success: false,
            error: true,
            message: "Failed to create blog",
        };
    }
}

export async function deleteBlog(blogId: string, userId: string): Promise<ApiResponse<null>> {
    try {
        await dbConnect();

        // Validate IDs
        if (!Types.ObjectId.isValid(blogId) || !Types.ObjectId.isValid(userId)) {
            return {
                success: false,
                error: true,
                message: "Invalid blog or user ID",
            };
        }

        // Soft delete - set isDeleted to true
        const result = await Blog.findOneAndUpdate(
            { 
                _id: blogId, 
                createdBy: userId,
                isDeleted: false 
            },
            { 
                isDeleted: true,
                deletedAt: new Date() 
            },
            { new: true }
        );

        if (!result) {
            return {
                success: false,
                error: true,
                message: "Blog not found or you don't have permission to delete it",
            };
        }

        return {
            success: true,
            message: "Blog deleted successfully",
        };

    } catch (error) {
        console.error("Error deleting blog:", error);
        return {
            success: false,
            error: true,
            message: "Failed to delete blog",
        };
    }
}

export async function getBlogById(blogId: string, userId: string): Promise<ApiResponse<any>> {
    try {
        await dbConnect();

        console.log(blogId )
        console.log(userId)

        // Validate IDs
        if (!Types.ObjectId.isValid(blogId) || !Types.ObjectId.isValid(userId)) {
            return {
                success: false,
                error: true,
                message: "Invalid blog or user ID",
            };
        }

        const blog = await Blog.findOne({
            _id: blogId,
            createdBy: userId,
            isDeleted: false
        })
        .populate({
            path: 'createdBy',
            select: 'fullName profileImage _id',
        })
        .populate({
            path: 'likedBy',
            select: 'fullName profileImage _id',
        })
        .lean();

        if (!blog) {
            return {
                success: false,
                error: true,
                message: "Blog not found or you don't have permission to view it",
            };
        }

        return {
            success: true,
            message: "Blog fetched successfully",
            data: blog
        };

    } catch (error) {
        console.error("Error fetching blog:", error);
        return {
            success: false,
            error: true,
            message: "Failed to fetch blog",
        };
    }
}

export async function getPaginatedBlogs(
    page: number = 1,
    limit: number = 10,
    filterOptions: {
        tag?: string;
        searchQuery?: string;
    } = {}
): Promise<ApiResponse<any>> {
    try {
        await dbConnect();

        // Validate pagination parameters
        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        const skip = (page - 1) * limit;

        // Build the base query for published, non-deleted blogs
        const query: any = { 
            isPublished: true,
            isDeleted: false 
        };

        // Add tag filter if provided
        if (filterOptions.tag) {
            query.tags = filterOptions.tag;
        }

        // Add text search if provided
        if (filterOptions.searchQuery) {
            query.$text = { $search: filterOptions.searchQuery };
        }

        const [blogs, totalCount] = await Promise.all([
            Blog.find(query)
                .populate({
                    path: 'createdBy',
                    select: 'fullName thumbnailUrl _id',
                })
                .select('title excerpt thumbnailUrl tags slug createdAt likesCount')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
                
            Blog.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            message: "Blogs fetched successfully",
            data: {
                blogs,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            }
        };

    } catch (error) {
        console.error("Error fetching paginated blogs:", error);
        return {
            success: false,
            error: true,
            message: "Failed to fetch blogs",
        };
    }
}