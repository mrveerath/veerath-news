import React, { useCallback, useEffect, useState } from "react"
import { getPaginatedBlogs } from "../actions/blogsAction"
import { toast } from "sonner"

export default function Page(): React.ReactElement {
    const [blogs, setBlogs] = useState([])

    const getAllBlogs = useCallback(async () => {
        const { message, success, data, error } = await getPaginatedBlogs(1, 10)
        if (success) {
            setBlogs(data.blogs)
            toast.success(message)
        }
        else {
            console.log(error)
        }
    }, [])
    useEffect(() => { getAllBlogs() }, [])
    console.log(blogs)

    return (
        <div>Hello From The Blogs Page</div>
    )
}