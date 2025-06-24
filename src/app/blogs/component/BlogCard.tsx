import { deleteBlog } from "@/app/actions/blogsAction";
import { Edit, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { toast } from "sonner";

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

export default function BlogCard({ details }: { details: GetBlogsResponse }): React.ReactElement {
    const { data } = useSession();
    const userId = data?.user.id || "";

    const handleDeleteBlogs = useCallback(async () => {
        const { message, success, error } = await deleteBlog(details.id, userId);
        if (error) {
            toast.error(message);
            return;
        }
        if (success) {
            toast.success(message);
            window.location.reload(); // 🔄 Full page refresh
        }
    }, [details.id, userId]);

    return (
        <div className="max-w-full rounded-none overflow-hidden shadow-lg m-4 bg-white dark:bg-zinc-800">
            <div className="flex gap-6 w-full justify-between px-6 py-4">
                <div>
                    <Link href={`/blogs/${details.id}`}>
                        <div className="font-bold text-xl mb-2 text-zinc-800 dark:text-white">{details.title}</div>
                    </Link>
                    <p className="text-zinc-700 dark:text-zinc-300 text-base">{details.excerpt}</p>
                </div>
                <img className="h-20 w-20 object-cover" src={details.thumbnailUrl} alt={details.title} />
            </div>
            <div className="px-6 py-4 flex items-center">
                <img className="w-10 h-10 rounded-full mr-4" src={details.createdBy.profileImage} alt={details.createdBy.fullName} />
                <div className="text-sm">
                    <Link href={`/profile/${details.createdBy._id}`}>
                        <p className="text-zinc-900 dark:text-white leading-none">{details.createdBy.fullName}</p>
                    </Link>
                </div>
                {data?.user?.id === details.createdBy._id && (
                    <div className="ml-auto flex gap-4">
                        <Link href={`/blogs/edit/${details.id}`} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-none">
                            <Edit size={16} />
                        </Link>
                        <button onClick={handleDeleteBlogs} className="cursor-pointer bg-red-600 text-white font-bold py-2 px-4 rounded-none">
                            <Trash size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
