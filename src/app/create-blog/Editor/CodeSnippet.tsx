'use client';

import React, { useState, useRef } from 'react';
import Prism from 'prismjs';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

// Import Prism theme and languages
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-matlab';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-vim';
import 'prismjs/components/prism-yaml';
import { Button } from '@/components/ui/button';

const languages = [
  'markup', 'css', 'javascript', 'jsx', 'tsx', 'typescript', 'bash', 'c', 'cpp', 'csharp',
  'dart', 'go', 'java', 'json', 'kotlin', 'lua', 'matlab', 'objectivec', 'perl',
  'php', 'python', 'r', 'ruby', 'rust', 'sass', 'scss', 'sql', 'swift', 'vim', 'yaml'
];

export default function CodeGenerator() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [highlightedCode, setHighlightedCode] = useState('');
  const rawCodeRef = useRef('');

  const handleGenerate = () => {
    rawCodeRef.current = code;

    try {
      const grammar = Prism.languages[language] || Prism.languages.markup;
      console.log(grammar)
      const highlighted = Prism.highlight(code, grammar, language);
      console.log(highlighted)
      setHighlightedCode(highlighted);
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err || 'Unsupported language selected.'}`);
      setHighlightedCode('');
    }
  };

  const handleCopy = () => {
    if (rawCodeRef.current) {
      navigator.clipboard.writeText(code)
        .then(() => toast.success('Raw code copied to clipboard!'))
        .catch(err => toast.error(`Failed to copy: ${err}`));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Code to HTML Generator</h1>

      <div className="space-y-4">
        <label htmlFor="language-select" className="block text-sm text-gray-300">
          Select Language
          <select
            id="language-select"
            className="mt-1 w-full bg-gray-800 text-white p-2 rounded"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select a programming language"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="code-input" className="block text-sm text-gray-300">
          Your Code
          <textarea
            id="code-input"
            className="mt-1 w-full bg-gray-900 text-white p-3 rounded h-40"
            placeholder="Enter your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Enter your code"
          />
        </label>

        <Button
        type='button'
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          aria-label="Generate HTML Content"
        >
          Generate HTML Content
        </Button>
      </div>

      {highlightedCode && (
        <div className="relative bg-gray-900 text-white rounded p-4 overflow-x-auto border border-gray-700">
          <Button
          type='button'
            onClick={handleCopy}
            className="absolute top-2 right-2 text-sm bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 flex items-center gap-1"
            aria-label="Copy code to clipboard"
          >
            <Copy size={14} />
            Copy
          </Button>
          <pre className="whitespace-pre-wrap">
            <code
              className={`language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        </div>
      )}
    </div>
  );
}
