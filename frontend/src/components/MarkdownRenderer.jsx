import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

const MarkdownRenderer = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Headings with proper styling
          h1({ node, children, ...props }) {
            return (
              <h1 
                className="text-4xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-200 pb-2"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            return (
              <h2 
                className="text-3xl font-bold mt-6 mb-3 text-gray-800"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            return (
              <h3 
                className="text-2xl font-semibold mt-5 mb-2 text-gray-800"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4({ node, children, ...props }) {
            return (
              <h4 
                className="text-xl font-semibold mt-4 mb-2 text-gray-700"
                {...props}
              >
                {children}
              </h4>
            );
          },
          h5({ node, children, ...props }) {
            return (
              <h5 
                className="text-lg font-semibold mt-3 mb-1 text-gray-700"
                {...props}
              >
                {children}
              </h5>
            );
          },
          h6({ node, children, ...props }) {
            return (
              <h6 
                className="text-base font-semibold mt-3 mb-1 text-gray-600"
                {...props}
              >
                {children}
              </h6>
            );
          },
          // Paragraphs
          p({ node, children, ...props }) {
            return (
              <p 
                className="text-base leading-7 text-gray-700 mb-4"
                {...props}
              >
                {children}
              </p>
            );
          },
          // Links
          a({ node, href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Images
          img({ node, src, alt, ...props }) {
            const imageSrc = src?.startsWith('images/') 
              ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${src}`
              : src;
            return (
              <div className="my-6">
                <img 
                  src={imageSrc} 
                  alt={alt} 
                  {...props} 
                  className="rounded-lg shadow-lg w-full border border-gray-200"
                />
              </div>
            );
          },
          // Code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-4 rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code 
                className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Blockquotes
          blockquote({ node, children, ...props }) {
            return (
              <blockquote 
                className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          // Lists
          ul({ node, children, ...props }) {
            return (
              <ul 
                className="list-disc list-inside space-y-2 my-4 text-gray-700"
                {...props}
              >
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol 
                className="list-decimal list-inside space-y-2 my-4 text-gray-700"
                {...props}
              >
                {children}
              </ol>
            );
          },
          li({ node, children, ...props }) {
            return (
              <li 
                className="ml-4 leading-7"
                {...props}
              >
                {children}
              </li>
            );
          },
          // Tables
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-6">
                <table 
                  className="min-w-full divide-y divide-gray-300 border border-gray-300"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, children, ...props }) {
            return (
              <thead className="bg-gray-50" {...props}>
                {children}
              </thead>
            );
          },
          tbody({ node, children, ...props }) {
            return (
              <tbody className="divide-y divide-gray-200 bg-white" {...props}>
                {children}
              </tbody>
            );
          },
          tr({ node, children, ...props }) {
            return <tr {...props}>{children}</tr>;
          },
          th({ node, children, ...props }) {
            return (
              <th 
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ node, children, ...props }) {
            return (
              <td 
                className="px-4 py-3 text-sm text-gray-700"
                {...props}
              >
                {children}
              </td>
            );
          },
          // Horizontal rule
          hr({ node, ...props }) {
            return <hr className="my-8 border-t-2 border-gray-300" {...props} />;
          },
          // Strong/Bold
          strong({ node, children, ...props }) {
            return (
              <strong className="font-bold text-gray-900" {...props}>
                {children}
              </strong>
            );
          },
          // Emphasis/Italic
          em({ node, children, ...props }) {
            return (
              <em className="italic text-gray-800" {...props}>
                {children}
              </em>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
