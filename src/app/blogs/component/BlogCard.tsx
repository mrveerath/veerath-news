import { deleteBlog } from "@/app/actions/blogsAction";
import { Edit, MoreVertical, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
    profession: string;
  };
  totalLikes: number;
  totalComments: number;
  slug:string
  totalReads: number;
}

export default function BlogCard({ details }: { details: GetBlogsResponse }): React.ReactElement {
  const { data } = useSession();
  const userId = data?.user.id || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  console.log(details.slug)

  const handleDeleteBlogs = useCallback(async () => {
    const { message, success, error } = await deleteBlog(details.id, userId);
    if (error) {
      toast.error(message);
      return;
    }
    if (success) {
      toast.success(message);
      window.location.reload();
    }
  }, [details.id, userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden transition hover:shadow-lg relative">
      <div className="flex flex-col md:flex-row relative">
        {/* Tag */}
        {details.tags[0] && (
          <span className="absolute top-0 left-0 bg-red-600 text-white text-xs px-3 py-1 rounded-br-lg">
            {details.tags[0]}
          </span>
        )}

        {/* Thumbnail */}
        {details.thumbnailUrl && (
          <Link href={`/blogs/${details.slug}`} className="md:w-1/3 w-full h-48 md:h-auto">
            <img
              src={details.thumbnailUrl}
              alt={details.title}
              className="object-cover w-full h-full"
            />
          </Link>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col justify-between w-full relative">
          {/* Title + Menu */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/blogs/${details.slug}`}>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline line-clamp-2">
                  {details.title}
                </h2>
              </Link>
            </div>

            {userId === details.createdBy._id && (
              <div className="relative" ref={menuRef}>
                <button
                  className="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-white"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <MoreVertical size={20} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-32 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded shadow-lg">
                    <Link
                      href={`/blogs/edit/${details.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-600"
                    >
                      <Edit size={14} /> Edit
                    </Link>
                    <button
                      onClick={handleDeleteBlogs}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <p className="text-sm text-zinc-700 dark:text-zinc-300 my-4 line-clamp-3">
            {details.excerpt}
          </p>

          {/* Footer: Author + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Author */}
            <Link href={`/profile/${details.createdBy._id}`} className="flex items-center gap-3 hover:underline">
              <Image
                src={details.createdBy.profileImage}
                alt={details.createdBy.fullName}
                height={100}
                width={100}
                className="w-10 h-10 rounded-full border-2 border-red-600"
              />
              <div className="text-sm">
                <p className="text-zinc-900 dark:text-white font-medium">
                  {details.createdBy.fullName}
                </p>
                <p className="text-xs text-zinc-500">{details.createdBy.profession}</p>
              </div>
            </Link>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span>👍 {details.totalLikes}</span>
              <span>💬 {details.totalComments}</span>
              <span>👁️ {details.totalReads}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
