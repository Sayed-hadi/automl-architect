
import React, { useState, useCallback, ChangeEvent } from 'react';
import type { WorkflowState } from '../types';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileProcessed: (content: string, name: string) => void;
  startAnalysis: (targetColumn: string) => void;
  initialState: WorkflowState;
  fileName: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, startAnalysis, initialState, fileName }) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        setError('Please upload a valid CSV file.');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split('\n')[0].trim();
        const headers = firstLine.split(',');
        setColumns(headers);
        setTargetColumn(headers[headers.length - 1] || '');
        onFileProcessed(text, file.name);
      };
      reader.readAsText(file);
    }
  }, [onFileProcessed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetColumn) {
      startAnalysis(targetColumn);
    } else {
      setError('Please select a target column to predict.');
    }
  };

  if (initialState === 'FILE_UPLOADED' || initialState === 'IDLE' && columns.length > 0) {
    return (
      <div className="text-center p-6">
        <h2 className="text-2xl font-semibold text-main-text mb-2">Dataset Ready</h2>
        <p className="text-dark-text mb-6">File: <span className="font-medium text-accent">{fileName}</span></p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <label htmlFor="target-column" className="block text-lg font-medium text-main-text mb-2">
            Select Target Column
          </label>
          <p className="text-sm text-dark-text mb-4">Choose the column you want the model to predict.</p>
          <select
            id="target-column"
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full bg-secondary border border-highlight text-main-text rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition"
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full mt-6 bg-accent hover:opacity-90 text-light-text font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-amber-900/20"
          >
            Start AutoML Analysis
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full p-4 text-center">
       <div className="border-2 border-dashed border-highlight rounded-xl p-8 sm:p-12 hover:border-accent transition-colors duration-300 bg-primary/50">
          <UploadIcon />
          <h3 className="text-xl font-semibold text-main-text mt-4">Upload Your Dataset</h3>
          <p className="text-dark-text mt-2">Drag & drop a CSV file here or click to select.</p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-upload"
            className="mt-6 inline-block bg-white text-dark-text hover:bg-accent hover:text-light-text font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors duration-300 border border-highlight"
          >
            Browse File
          </label>
          {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        </div>
    </div>
  );
};
