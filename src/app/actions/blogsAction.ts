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

export interface GetBlogsResponse {
    id: string;
    title: string;
    excerpt: string;
    thumbnailUrl: string;
    tags: string[];
    createdBy: {
        fullName: string;
        profileImage: string;
        _id: string;
    };
}

interface BlogDocument {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    thumbnailUrl: string;
    tags: string[];
    slug: string;
    metaTitle: string;
    metaDescription: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        fullName: string;
        profileImage: string;
        _id: string;
    };
    likedBy: Array<{
        fullName: string;
        profileImage: string;
        _id: string;
    }>;
    likesCount: number;
}

interface PaginatedBlogsResponse {
    allBlogs: GetBlogsResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;

    };
}

export async function getBlogs(userId: string): Promise<ApiResponse<GetBlogsResponse[]>> {
    try {
        await dbConnect();

        const allblogs = await Blog.find({
            createdBy: userId,
            isDeleted: false
        })
            .select("title excerpt thumbnailUrl tags createdBy")
            .populate({
                path: 'createdBy',
                select: 'fullName profileImage _id',
            })
            .sort({ createdAt: -1 })
            .lean();

        const blogs: GetBlogsResponse[] = allblogs.map((B) => ({
            id: String(B._id),
            title: B.title,
            excerpt: B.excerpt,
            thumbnailUrl: B.thumbnailUrl,
            tags: B.tags as string[],
            createdBy: {
                fullName: B.createdBy.fullName,
                profileImage: B.createdBy.profileImage,
                _id: String(B.createdBy._id)
            }
        }));

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

export async function createBlog(blogData: BlogData): Promise<ApiResponse<string>> {
    try {
        await dbConnect();

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
        return {
            success: true,
            message: "Blog created successfully",
            data: String(newBlog._id)
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

export async function getBlogById(blogId: string): Promise<ApiResponse<BlogDocument>> {
    try {
        await dbConnect();

        if (!Types.ObjectId.isValid(blogId)) {
            return {
                success: false,
                error: true,
                message: "Invalid blog or user ID",
            };
        }

        const blog = await Blog.findOne({
            _id: blogId,
            isDeleted: false
        })
            .populate<{ createdBy: { fullName: string; profileImage: string; _id: Types.ObjectId } }>(
                'createdBy',
                'fullName profileImage _id'
            )
            .populate<{ likedBy: Array<{ fullName: string; profileImage: string; _id: Types.ObjectId }> }>(
                'likedBy',
                'fullName profileImage _id'
            )
            .lean<BlogDocument>();


        if (!blog) {
            return {
                success: false,
                error: true,
                message: "Blog not found or you don't have permission to view it",
            };
        }

        const blogResponse: BlogDocument = {
            _id: String(blog._id),
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
            thumbnailUrl: blog.thumbnailUrl,
            tags: blog.tags,
            slug: blog.slug,
            metaTitle: blog.metaTitle,
            metaDescription: blog.metaDescription,
            isPublished: blog.isPublished,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
            createdBy: {
                fullName: blog.createdBy.fullName,
                profileImage: blog.createdBy.profileImage,
                _id: String(blog.createdBy._id),
            },
            likedBy: blog.likedBy.map(like => ({
                fullName: like.fullName,
                profileImage: like.profileImage,
                _id: String(like._id),
            })),
            likesCount: blog.likesCount,
        };

        return {
            success: true,
            message: "Blog fetched successfully",
            data: blogResponse
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
): Promise<ApiResponse<PaginatedBlogsResponse>> {
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

        const blogs = await Blog.find(query)
            .select('title excerpt thumbnailUrl tags slug createdAt likesCount')
            .populate({
                path: 'createdBy',
                select: 'fullName profileImage _id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        console.log(blogs)

        const allBlogs: GetBlogsResponse[] = blogs.map((B) => ({
            id: String(B._id),
            title: B.title,
            excerpt: B.excerpt,
            thumbnailUrl: B.thumbnailUrl,
            tags: B.tags as string[],
            createdBy: {
                fullName: B.createdBy.fullName,
                profileImage: B.createdBy.profileImage,
                _id: String(B.createdBy._id)
            }
        }));
        console.log(allBlogs)


        return {
            success: true,
            message: "Blogs fetched successfully",
            data: {
                allBlogs,
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalCount: 10,
                    limit: 10,
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
