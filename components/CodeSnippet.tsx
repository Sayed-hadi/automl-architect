
import React, { useState } from 'react';
import { CopyIcon, DownloadIcon } from './Icons';

interface CodeSnippetProps {
  code: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automl_model.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-stone-900 border border-highlight rounded-lg relative mt-4">
      <div className="absolute top-3 right-3 flex space-x-2">
        <button
          onClick={handleCopy}
          className="p-2 bg-stone-700/70 hover:bg-stone-600 rounded-md transition-colors"
          title="Copy code"
        >
          <span className="sr-only">Copy code</span>
          {copied ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon />}
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-stone-700/70 hover:bg-stone-600 rounded-md transition-colors"
          title="Download code"
        >
          <span className="sr-only">Download code</span>
          <DownloadIcon />
        </button>
      </div>
      <pre className="p-4 pt-12 text-sm overflow-x-auto text-stone-200 rounded-lg">
        <code className="language-python">{code}</code>
      </pre>
    </div>
  );
};
