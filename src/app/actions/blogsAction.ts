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
    slug:string;
    thumbnailUrl: string;
    tags: string[];
    createdBy: {
        fullName: string;
        profileImage: string;
        _id: string;
        profession: string;
    };
    createdAt: Date;
    totalLikes: number;
    totalComments: number;
    totalReads: number;
}

export interface BlogDocument {
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
    comments:string[]
    createdBy: {
        fullName: string;
        profileImage: string;
        _id: string;
    };
    likedBy: string[];
    readedBy: string[];
    totalComments: number;
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

// ✅ Function 1: Fetch blogs by a user
export async function getBlogs(userId: string): Promise<ApiResponse<GetBlogsResponse[]>> {
    try {
        await dbConnect();

        const allblogs = await Blog.find({ createdBy: userId, isDeleted: false })
            .select("title excerpt thumbnailUrl tags createdBy likedBy comments readedBy createdAt slug")
            .populate({ path: 'createdBy', select: 'fullName profileImage _id profession' })
            .sort({ createdAt: -1 })
            .lean();

            console.log(allblogs)

        const blogs: GetBlogsResponse[] = allblogs.map((B) => ({
            id: String(B._id),
            title: B.title,
            excerpt: B.excerpt,
            thumbnailUrl: B.thumbnailUrl,
            tags: B.tags,
            createdBy: {
                fullName: B.createdBy.fullName,
                profileImage: B.createdBy.profileImage,
                _id: String(B.createdBy._id),
                profession: B.createdBy.profession,
            },
            createdAt: B.createdAt,
            totalComments: B.comments?.length || 0,
            totalLikes: B.likedBy?.length || 0,
            totalReads: B.readedBy?.length || 0,
            slug:B.slug
        }));

        return { success: true, message: "Blogs fetched successfully", data: blogs };
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return { success: false, error: true, message: "Failed to fetch blogs" };
    }
}

// ✅ Function 2: Create a blog
export async function createBlog(blogData: BlogData): Promise<ApiResponse<string>> {
    try {
        await dbConnect();

        const { content, excerpt, isPublished, metaDescription, metaTitle, slug, tags, thumbnailUrl, title, userId } = blogData;

        if (!content || !excerpt || !metaDescription || !metaTitle || !slug || !thumbnailUrl || !title || !userId) {
            return { success: false, error: true, message: "All required fields must be provided" };
        }

        const existingBlog = await Blog.findOne({ slug, isDeleted: false });
        if (existingBlog) {
            return { success: false, error: true, message: "Blog with this slug already exists" };
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
            publishedAt: isPublished ? new Date() : null,
        });

        await newBlog.save();
        return { success: true, message: "Blog created successfully", data: String(newBlog._id) };
    } catch (error) {
        console.error("Error creating blog:", error);
        return { success: false, error: true, message: "Failed to create blog" };
    }
}

// ✅ Function 3: Soft delete blog
export async function deleteBlog(blogId: string, userId: string): Promise<ApiResponse<null>> {
    try {
        await dbConnect();

        if (!Types.ObjectId.isValid(blogId) || !Types.ObjectId.isValid(userId)) {
            return { success: false, error: true, message: "Invalid blog or user ID" };
        }

        const result = await Blog.findOneAndUpdate(
            { _id: blogId, createdBy: userId, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!result) {
            return { success: false, error: true, message: "Blog not found or unauthorized" };
        }

        return { success: true, message: "Blog deleted successfully" };
    } catch (error) {
        console.error("Error deleting blog:", error);
        return { success: false, error: true, message: "Failed to delete blog" };
    }
}

// ✅ Function 4: Get blog by ID
export async function getBlogById(blogId: string): Promise<ApiResponse<BlogDocument>> {
    try {
        await dbConnect();

        if(!blogId){
            return { success: false, error: true, message: "Please Provide The Slug" };
        }
        console.log(blogId)

        const blog = await Blog.findOne({ slug: blogId, isDeleted: false })
            .populate('createdBy', 'fullName profileImage _id')
            .populate('likedBy', 'fullName profileImage _id')
            .lean<BlogDocument>();

            console.log(blog)
        if (!blog) {
            return { success: false, error: true, message: "Blog not found" };
        }

        const response = {
            _id: String(blog?._id),
            title: blog?.title,
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
            likedBy: blog.likedBy.map((like) => like.toString()),
            readedBy: blog.readedBy.map((comment) => comment.toString()),
            totalComments: blog.comments.length || 0,
            comments:blog.comments
        };

        return { success: true, message: "Blog fetched successfully", data: response };
    } catch (error) {
        console.error("Error fetching blog:", error);
        return { success: false, error: true, message: "Failed to fetch blog" };
    }
}

// ✅ Function 5: Paginated blog fetch
export async function getPaginatedBlogs(
    page: number = 1,
    limit: number = 10,
    filterOptions: { tag?: string; searchQuery?: string } = {}
): Promise<ApiResponse<PaginatedBlogsResponse>> {
    try {
        await dbConnect();

        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        const skip = (page - 1) * limit;

        const query: any = { isPublished: true, isDeleted: false };

        if (filterOptions.tag) query.tags = filterOptions.tag;
        if (filterOptions.searchQuery) query.$text = { $search: filterOptions.searchQuery };

        const [blogs, totalCount] = await Promise.all([
            Blog.find(query)
                .select("title excerpt thumbnailUrl tags slug createdAt likedBy comments createdBy")
                .populate("createdBy", "fullName profileImage _id profession")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Blog.countDocuments(query),
        ]);

        const allBlogs: GetBlogsResponse[] = blogs.map((B) => ({
            id: String(B._id),
            title: B.title,
            excerpt: B.excerpt,
            thumbnailUrl: B.thumbnailUrl,
            tags: B.tags,
            slug:B.slug,
            createdBy: {
                fullName: B.createdBy.fullName,
                profileImage: B.createdBy.profileImage,
                _id: String(B.createdBy._id),
                profession: B.createdBy.profession,
            },
            createdAt: B.createdAt,
            totalLikes: B.likedBy?.length || 0,
            totalComments: B.comments?.length || 0,
            totalReads: B.readedBy?.length || 0,
        }));

        return {
            success: true,
            message: "Blogs fetched successfully",
            data: {
                allBlogs,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    limit,
                },
            },
        };
    } catch (error) {
        console.error("Error fetching paginated blogs:", error);
        return { success: false, error: true, message: "Failed to fetch blogs" };
    }
}