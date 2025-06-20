import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { useDropzone } from 'react-dropzone';
import { FaBold, FaItalic, FaUnderline, FaStrikethrough, FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaCode, FaQuoteLeft, FaMinus, FaTable, FaLink, FaImage, FaUndo, FaRedo } from 'react-icons/fa';
import { MdHighlight } from 'react-icons/md';

// Import languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import scala from 'highlight.js/lib/languages/scala';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';

// Create a lowlight instance and register languages
const lowlight = createLowlight();

lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('java', java);
lowlight.register('cpp', cpp);
lowlight.register('c', c);
lowlight.register('csharp', csharp);
lowlight.register('go', go);
lowlight.register('rust', rust);
lowlight.register('swift', swift);
lowlight.register('kotlin', kotlin);
lowlight.register('ruby', ruby);
lowlight.register('php', php);
lowlight.register('scala', scala);
lowlight.register('sql', sql);
lowlight.register('bash', bash);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('json', json);
lowlight.register('markdown', markdown);
lowlight.register('yaml', yaml);
lowlight.register('xml', xml);

const RichTextEditor = ({ value, onChange }:{
  value:string,
  onChange:(value:string) => void
}) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Write something amazing...',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg my-2',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-zinc-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-zinc-300 p-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 focus:outline-none min-h-[300px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-b-lg',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles:File[]) => {
      if (!acceptedFiles.length || !editor) return;

      const file = acceptedFiles[0];
      const mockUrl = URL.createObjectURL(file);

      editor.chain().focus().setImage({ src: mockUrl }).run();
    },
    [editor]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxFiles: 1,
  });

  const addLink = () => {
    if (!editor) return;

    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }

    setLinkUrl('');
    setIsLinkModalOpen(false);
  };

  const addImage = () => {
    if (!editor || !imageUrl) return;

    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
  };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="flex flex-wrap gap-2 mb-2 p-2 bg-zinc-100 dark:bg-zinc-700 rounded-t-lg border border-zinc-200 dark:border-zinc-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('bold') ? 'bg-red-600 text-white' : ''
          }`}
          title="Bold"
        >
          <FaBold />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('italic') ? 'bg-red-600 text-white' : ''
          }`}
          title="Italic"
        >
          <FaItalic />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('underline') ? 'bg-red-600 text-white' : ''
          }`}
          title="Underline"
        >
          <FaUnderline />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('strike') ? 'bg-red-600 text-white' : ''
          }`}
          title="Strikethrough"
        >
          <FaStrikethrough />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('highlight') ? 'bg-red-600 text-white' : ''
          }`}
          title="Highlight"
        >
          <MdHighlight />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={`p-2 rounded font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('heading', { level: 4 }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Heading 4"
        >
          H4
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('bulletList') ? 'bg-red-600 text-white' : ''
          }`}
          title="Bullet List"
        >
          <FaListUl />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('orderedList') ? 'bg-red-600 text-white' : ''
          }`}
          title="Ordered List"
        >
          <FaListOl />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Align Left"
        >
          <FaAlignLeft />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Align Center"
        >
          <FaAlignCenter />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Align Right"
        >
          <FaAlignRight />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-red-600 text-white' : ''
          }`}
          title="Justify"
        >
          <FaAlignJustify />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('code') ? 'bg-red-600 text-white' : ''
          }`}
          title="Inline Code"
        >
          <FaCode />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('codeBlock') ? 'bg-red-600 text-white' : ''
          }`}
          title="Code Block"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('blockquote') ? 'bg-red-600 text-white' : ''
          }`}
          title="Blockquote"
        >
          <FaQuoteLeft />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
          title="Horizontal Rule"
        >
          <FaMinus />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
          title="Insert Table"
        >
          <FaTable />
        </button>
        <button
          type="button"
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              setIsLinkModalOpen(true);
              setLinkUrl(editor.getAttributes('link').href || '');
            }
          }}
          className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
            editor.isActive('link') ? 'bg-red-600 text-white' : ''
          }`}
          title="Link"
        >
          <FaLink />
        </button>
        <div {...getRootProps()} className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 cursor-pointer" title="Upload Image">
          <input {...getInputProps()} />
          <FaImage />
        </div>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter the URL of the image:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
          title="Insert Image"
        >
          URL Image
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50"
          title="Undo"
        >
          <FaUndo />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50"
          title="Redo"
        >
          <FaRedo />
        </button>
      </div>

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-600">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
                editor.isActive('bold') ? 'bg-red-600 text-white' : ''
              }`}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
                editor.isActive('italic') ? 'bg-red-600 text-white' : ''
              }`}
            >
              Italic
            </button>
            <button
              onClick={() => editor.chain().focus().toggleLink({ href: linkUrl }).run()}
              className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 ${
                editor.isActive('link') ? 'bg-red-600 text-white' : ''
              }`}
            >
              Link
            </button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent className="raw-html" style={{ all: 'revert' }} editor={editor} />

      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-2">Add Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded mb-2"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 rounded hover:bg-zinc-300 dark:hover:bg-zinc-500"
              >
                Cancel
              </button>
              <button
                onClick={addLink}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Insert Image by URL</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded"
          />
          <button
            onClick={addImage}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
