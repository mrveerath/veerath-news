'use client';

import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import RichTextEditor from './Editor/Editor';
import { createBlog } from '../actions/blogsAction';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface BlogData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string;
  userId: string | undefined;
}

export default function Page(): React.ReactElement {
  const { data, status } = useSession();
  const router = useRouter();
  const userId = data?.user.id;
  const [blogData, setBlogData] = useState<BlogData>({
    title: '',
    slug: '',
    excerpt: '',
    content: 'Start From Here',
    thumbnailUrl: '',
    metaTitle: '',
    metaDescription: '',
    tags: [],
    isPublished: false,
    publishedAt: new Date().toISOString().split('T')[0],
    userId: userId || ""
  });

  const [characterCount, setCharacterCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setBlogData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === 'title') {
        const generatedSlug = value
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
          .substring(0, 60);
        setBlogData((prev) => ({
          ...prev,
          slug: generatedSlug,
          metaTitle: value.substring(0, 60),
        }));
      }
    },
    []
  );

  const handleTagsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setBlogData((prev) => ({ ...prev, tags }));
  }, []);

  const handleEditorChange = useCallback((content: string) => {
    setBlogData((prev) => ({
      ...prev,
      content: content,
    }));
    setCharacterCount(content.length);
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!blogData.title.trim()) newErrors.title = 'Title is required';
    if (!blogData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!blogData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!blogData.content.trim()) newErrors.content = 'Content is required';
    if (blogData.excerpt.length > 160) newErrors.excerpt = 'Excerpt must be 160 characters or less';
    if (!blogData.thumbnailUrl.trim()) newErrors.thumbnailUrl = 'Thumbnail URL is required';
    if (!blogData.metaTitle.trim()) newErrors.metaTitle = 'Meta title is required';
    if (!blogData.metaDescription.trim()) newErrors.metaDescription = 'Meta description is required';
    if (blogData.metaDescription.length > 160)
      newErrors.metaDescription = 'Meta description must be 160 characters or less';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [blogData]);

  const saveToDatabase = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      const { message, success, data, error } = await createBlog(blogData);
      if (success) {
        toast.success(message);
        router.push(`/blogs/${data}`);
      }
      console.log(error);
      setIsSubmitting(false);
    }
  }, [blogData, validate, router]);

  return (
    <>
      <Head>
        <title>Blog Editor - Create Your Blog Post</title>
        <meta name="description" content="Create and edit blog posts with our accessible, SEO-optimized blog editor." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-12 min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200">Create New Blog Post</h1>
        </div>

        <form onSubmit={saveToDatabase} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="shadow-lg p-6 bg-zinc-100 dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800">
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={blogData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${errors.title ? 'border-red-500' : ''
                    }`}
                  placeholder="Enter blog title"
                  required
                  aria-describedby={errors.title ? 'title-error' : undefined}
                />
                {errors.title && <p id="title-error" className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="mb-6">
                <label htmlFor="excerpt" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Excerpt <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={blogData.excerpt}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${errors.excerpt ? 'border-red-500' : ''
                    }`}
                  placeholder="Short description of your blog (max 160 characters)"
                  rows={3}
                  maxLength={160}
                  required
                  aria-describedby={errors.excerpt ? 'excerpt-error' : 'excerpt-count'}
                />
                <p id="excerpt-count" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {blogData.excerpt.length}/160 characters
                </p>
                {errors.excerpt && <p id="excerpt-error" className="mt-1 text-sm text-red-500">{errors.excerpt}</p>}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="editor" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Characters: {characterCount}/10000
                  </span>
                </div>
                <div className="editor-container">
                  <RichTextEditor value={blogData.content} onChange={handleEditorChange} />
                </div>
                {errors.content && <p id="content-error" className="mt-1 text-sm text-red-500">{errors.content}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="shadow-lg p-6 bg-zinc-100 dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Publishing</h2>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Status
                </label>
                <select
                  id="status"
                  name="isPublished"
                  value={blogData.isPublished ? 'published' : 'draft'}
                  onChange={(e) =>
                    setBlogData((prev) => ({
                      ...prev,
                      isPublished: e.target.value === 'published',
                    }))
                  }
                  className="w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  aria-label="Publication status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="publishedAt" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Publish Date
                </label>
                <input
                  id="publishedAt"
                  type="date"
                  name="publishedAt"
                  value={blogData.publishedAt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  aria-label="Publication date"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed`}
                aria-label="Save blog post"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Blog Post'
                )}
              </button>
            </div>

            <div className="shadow-lg p-6 bg-zinc-100 dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Featured Image</h2>
              <div className="mb-4">
                <label htmlFor="thumbnailUrl" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Thumbnail URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="thumbnailUrl"
                  type="url"
                  name="thumbnailUrl"
                  value={blogData.thumbnailUrl}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${errors.thumbnailUrl ? 'border-red-500' : ''
                    }`}
                  placeholder="https://example.com/image.jpg"
                  required
                  aria-describedby={errors.thumbnailUrl ? 'thumbnail-error' : undefined}
                />
                {errors.thumbnailUrl && (
                  <p id="thumbnail-error" className="mt-1 text-sm text-red-500">
                    {errors.thumbnailUrl}
                  </p>
                )}
              </div>

              {blogData.thumbnailUrl && (
                <div className="mt-2">
                  <Image
                    src={blogData.thumbnailUrl}
                    alt="Thumbnail preview"
                    width={300}
                    height={200}
                    className="w-full h-auto rounded-none border border-zinc-200 dark:border-zinc-700 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/OhfPQAJMQH/6vtN4QAAAABJRU5ErkJggg=="
                  />
                </div>
              )}
            </div>

            <div className="shadow-lg p-6 bg-zinc-100 dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">SEO Settings</h2>
              <div className="mb-4">
                <label htmlFor="slug" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  type="text"
                  name="slug"
                  value={blogData.slug}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${errors.slug ? 'border-red-500' : ''
                    }`}
                  placeholder="blog-post-title"
                  required
                  aria-describedby={errors.slug ? 'slug-error' : undefined}
                />
                {errors.slug && (
                  <p id="slug-error" className="mt-1 text-sm text-red-500">
                    {errors.slug}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="metaTitle" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Meta Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="metaTitle"
                  type="text"
                  name="metaTitle"
                  value={blogData.metaTitle}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${errors.metaTitle ? 'border-red-500' : ''
                    }`}
                  placeholder="SEO title for search engines (max 60 characters)"
                  maxLength={60}
                  required
                  aria-describedby={errors.metaTitle ? 'metaTitle-error' : 'metaTitle-count'}
                />
                <p id="metaTitle-count" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {blogData.metaTitle.length}/60 characters
                </p>
                {errors.metaTitle && (
                  <p id="metaTitle-error" className="mt-1 text-sm text-red-500">
                    {errors.metaTitle}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="metaDescription" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Meta Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={blogData.metaDescription}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${errors.metaDescription ? 'border-red-500' : ''
                    }`}
                  placeholder="SEO description for search engines (max 160 characters)"
                  rows={3}
                  maxLength={160}
                  required
                  aria-describedby={errors.metaDescription ? 'metaDescription-error' : 'metaDescription-count'}
                />
                <p id="metaDescription-count" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {blogData.metaDescription.length}/160 characters
                </p>
                {errors.metaDescription && (
                  <p id="metaDescription-error" className="mt-1 text-sm text-red-500">
                    {errors.metaDescription}
                  </p>
                )}
              </div>
            </div>

            <div className="shadow-lg p-6 bg-zinc-100 dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Tags</h2>
              <div className="mb-4">
                <label htmlFor="tags" className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={blogData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-4 py-2 rounded-none border focus:ring-2 focus:ring-red-500 focus:border-transparent bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  placeholder="technology, web development, design"
                  aria-label="Blog tags"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {blogData.tags
                    .filter((tag) => tag.trim() !== '')
                    .map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-none">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}