'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface BlogData {
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
}

const editorStyles = `
  .tox-tinymce { border-radius: 0.375rem; }
  .tox-statusbar { display: none; }
  .editor-container { position: relative; }
  .tox .tox-edit-area__iframe { background-color: #fff; }
  .tox .tox-toolbar,
  .tox .tox-menubar,
  .tox .tox-sidebar-wrap { background-color: #f8fafc; color: #1f2937; }
`;

const editorInit = {
  height: 500,
  menubar: 'file edit view insert format tools table help',
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
  ],
  toolbar:
    'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code preview',
  content_style: `
    body {
      font-family: Inter, sans-serif;
      font-size: 16px;
      background-color: #fff;
      color: #1f2937;
    }
  `,
  images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Image upload failed');
    return data.location;
  },
};

// Custom debounce function with proper typing
function debounce<T extends (...args: never[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export default function Page(): React.ReactElement {
  const router = useRouter();
  const editorRef = useRef<{ getContent: (options?: { format: string }) => string; setContent: (content: string) => void } | null>(null);
  const [blogData, setBlogData] = useState<BlogData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnailUrl: '',
    metaTitle: '',
    metaDescription: '',
    tags: [],
    isPublished: false,
    publishedAt: new Date().toISOString().split('T')[0],
  });
  const [characterCount, setCharacterCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = editorStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const updateCharacterCount = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.getContent({ format: 'text' });
      setCharacterCount(content.length);
    }
  }, []);

  useEffect(() => {
    const debouncedUpdate = debounce(updateCharacterCount, 300);
    if (editorRef.current) {
      debouncedUpdate();
    }
  }, [updateCharacterCount]);

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
    }, []);

  const handleTagsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setBlogData((prev) => ({ ...prev, tags }));
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

  const saveToDatabase = useCallback(async () => {
    if (!validate() || !editorRef.current) return;

    setIsSubmitting(true);
    try {
      const sanitizedContent = DOMPurify.sanitize(editorRef.current.getContent(), {
        ALLOWED_TAGS: [
          'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
          'strong', 'em', 'u', 's', 'sup', 'sub', 'ul', 'ol', 'li', 'table',
          'tr', 'td', 'th', 'a', 'img', 'div', 'span', 'br', 'hr'
        ],
        ALLOWED_ATTR: ['class', 'href', 'src', 'alt', 'title', 'width', 'height'],
      });

      const dataToSave = {
        ...blogData,
        content: sanitizedContent,
      };

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
        credentials: 'same-origin',
      });

      if (response.ok) {
        alert('Blog saved successfully!');
        router.push('/blogs');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save blog');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error saving blog';
      console.error('Error saving blog:', message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [blogData, router, validate]);

  return (
    <>
      <Head>
        <title>Blog Editor - Create Your Blog Post</title>
        <meta name="description" content="Create and edit blog posts with our accessible, SEO-optimized blog editor." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-20 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-red-600">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">Create New Blog Post</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className=" shadow-lg p-6 bg-zinc-200 dark:bg-zinc-800">
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium mb-1 text-red-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={blogData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Enter blog title"
                  required
                  aria-describedby={errors.title ? 'title-error' : undefined}
                />
                {errors.title && (
                  <p id="title-error" className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="excerpt" className="block text-sm font-medium mb-1 text-red-700">
                  Excerpt <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={blogData.excerpt}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600 ${errors.excerpt ? 'border-red-500' : ''}`}
                  placeholder="Short description of your blog (max 160 characters)"
                  rows={3}
                  maxLength={160}
                  required
                  aria-describedby={errors.excerpt ? 'excerpt-error' : 'excerpt-count'}
                />
                <p id="excerpt-count" className="mt-1 text-xs text-zinc-500">
                  {blogData.excerpt.length}/160 characters
                </p>
                {errors.excerpt && (
                  <p id="excerpt-error" className="mt-1 text-sm text-red-500">{errors.excerpt}</p>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="editor" className="block text-sm font-medium text-red-700">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-sm text-zinc-500">
                    Characters: {characterCount}/10000
                  </span>
                </div>
                <div className="editor-container">
                  <Editor
<<<<<<< HEAD
<<<<<<< HEAD
                    apiKey={process.env.TINY_MCE_EDITOR_API_KEY}
=======
                    apiKey="0bdb99ip4v6gbut5addtvquehv0bfgyglx2qd1kwdfpg4iy1"
>>>>>>> master
=======
                    apiKey={process.env.TINY_MCE_EDITOR_API_KEY}
>>>>>>> b48fbca26c30a6a27d53857c64c0245076d32823
                    onInit={(evt, editor) => {
                      editorRef.current = editor;
                      updateCharacterCount();
                    }}
                    initialValue={blogData.content}
                    init={editorInit}
                    aria-label="Blog Editor"
                    onEditorChange={updateCharacterCount}
                  />
                </div>
                {errors.content && (
                  <p id="content-error" className="mt-1 text-sm text-red-500">{errors.content}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className=" shadow-lg p-6 bg-zinc-200 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold text-red-600 mb-4">Publishing</h2>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium mb-1 text-red-700">
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
                  className="w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600"
                  aria-label="Publication status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="publishedAt" className="block text-sm font-medium mb-1 text-red-700">
                  Publish Date
                </label>
                <input
                  id="publishedAt"
                  type="date"
                  name="publishedAt"
                  value={blogData.publishedAt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600"
                  aria-label="Publication date"
                />
              </div>

              <button
                onClick={saveToDatabase}
                disabled={isSubmitting}
                className={`w-full py-2 px-4  focus:ring-2 outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed`}
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

            <div className=" shadow-lg p-6 bg-zinc-200 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold text-red-600 mb-4">Featured Image</h2>
              <div className="mb-4">
                <label htmlFor="thumbnailUrl" className="block text-sm font-medium mb-1 text-red-700">
                  Thumbnail URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="thumbnailUrl"
                  type="url"
                  name="thumbnailUrl"
                  value={blogData.thumbnailUrl}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600 ${errors.thumbnailUrl ? 'border-red-500' : ''}`}
                  placeholder="https://example.com/image.jpg"
                  required
                  aria-describedby={errors.thumbnailUrl ? 'thumbnail-error' : undefined}
                />
                {errors.thumbnailUrl && (
                  <p id="thumbnail-error" className="mt-1 text-sm text-red-500">{errors.thumbnailUrl}</p>
                )}
              </div>

              {blogData.thumbnailUrl && (
                <div className="mt-2">
                  <Image
                    src={blogData.thumbnailUrl}
                    alt="Thumbnail preview"
                    width={300}
                    height={200}
                    className="w-full h-auto  border border-zinc-200 object-cover"
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

            <div className=" shadow-lg p-6 bg-zinc-200 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold text-red-600 mb-4">SEO Settings</h2>
              <div className="mb-4">
                <label htmlFor="slug" className="block text-sm font-medium mb-1 text-red-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  type="text"
                  name="slug"
                  value={blogData.slug}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600 ${errors.slug ? 'border-red-500' : ''}`}
                  placeholder="blog-post-title"
                  required
                  aria-describedby={errors.slug ? 'slug-error' : undefined}
                />
                {errors.slug && (
                  <p id="slug-error" className="mt-1 text-sm text-red-500">{errors.slug}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="metaTitle" className="block text-sm font-medium mb-1 text-red-700">
                  Meta Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="metaTitle"
                  type="text"
                  name="metaTitle"
                  value={blogData.metaTitle}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600 ${errors.metaTitle ? 'border-red-500' : ''}`}
                  placeholder="SEO title for search engines (max 60 characters)"
                  maxLength={60}
                  required
                  aria-describedby={errors.metaTitle ? 'metaTitle-error' : 'metaTitle-count'}
                />
                <p id="metaTitle-count" className="mt-1 text-xs text-zinc-500">
                  {blogData.metaTitle.length}/60 characters
                </p>
                {errors.metaTitle && (
                  <p id="metaTitle-error" className="mt-1 text-sm text-red-500">{errors.metaTitle}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="metaDescription" className="block text-sm font-medium mb-1 text-red-700">
                  Meta Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={blogData.metaDescription}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600 ${errors.metaDescription ? 'border-red-500' : ''}`}
                  placeholder="SEO description for search engines (max 160 characters)"
                  rows={3}
                  maxLength={160}
                  required
                  aria-describedby={errors.metaDescription ? 'metaDescription-error' : 'metaDescription-count'}
                />
                <p id="metaDescription-count" className="mt-1 text-xs text-zinc-500">
                  {blogData.metaDescription.length}/160 characters
                </p>
                {errors.metaDescription && (
                  <p id="metaDescription-error" className="mt-1 text-sm text-red-500">{errors.metaDescription}</p>
                )}
              </div>
            </div>

            <div className=" shadow-lg p-6 bg-zinc-200 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold text-red-600 mb-4">Tags</h2>
              <div className="mb-4">
                <label htmlFor="tags" className="block text-sm font-medium mb-1 text-red-700">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={blogData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-4 py-2 border  focus:ring-2 outline-none focus:ring-red-500 focus:border-transparent bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-red-600"
                  placeholder="technology, web development, design"
                  aria-label="Blog tags"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {blogData.tags.filter((tag) => tag.trim() !== '').map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs  bg-red-100 text-red-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
