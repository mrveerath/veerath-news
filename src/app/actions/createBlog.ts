"use server"
import { dbConnect } from "@/lib/dbConnect";
import { BlogData } from "../create-blog/page";
import { Blog } from "@/models/blog.model";

export const simulateServerSideAction = async (blogData: BlogData) => {
    try {
        await dbConnect()
        const { content, excerpt, isPublished,
            metaDescription, metaTitle,
            publishedAt, slug, tags, thumbnailUrl, title, userId } = blogData
        const newBlog = await new Blog({
            content, excerpt, isPublished,
            metaDescription, metaTitle,
            publishedAt, slug, tags,
            thumbnailUrl, title, createdBy: userId
        })
        await newBlog.save()
        return true
    } catch (error) {
        console.log(error)
        return false
    }
};