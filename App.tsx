
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { WorkflowStepper } from './components/WorkflowStepper';
import { ResultsDashboard } from './components/ResultsDashboard';
import { Loader } from './components/Loader';
import { runAutoMLPipeline } from './services/geminiService';
import type { AutoMLResults, WorkflowState } from './types';
import { GithubIcon, ArtisanIcon } from './components/Icons';


const App: React.FC = () => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>('IDLE');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [results, setResults] = useState<AutoMLResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const handleFileProcessed = (content: string, name: string) => {
    setFileContent(content);
    setFileName(name);
    setWorkflowState('FILE_UPLOADED');
    setResults(null);
    setError(null);
  };

  const startAnalysis = useCallback(async (targetColumn: string) => {
    if (!fileContent) {
      setError('No file content available to analyze.');
      return;
    }
    setWorkflowState('ANALYZING');
    setError(null);
    setResults(null);
    setProgressMessage('Initializing AutoML pipeline...');

    try {
      const analysisResult = await runAutoMLPipeline(
        fileContent,
        targetColumn,
        (message: string) => {
            setProgressMessage(message);
        }
      );
      setResults(analysisResult);
      setWorkflowState('DONE');
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Analysis failed: ${errorMessage}. Please check the console for more details and try again.`);
      setWorkflowState('ERROR');
    }
  }, [fileContent]);

  const handleReset = () => {
    setWorkflowState('IDLE');
    setFileContent(null);
    setFileName('');
    setResults(null);
    setError(null);
  };

  const renderContent = () => {
    switch (workflowState) {
      case 'ANALYZING':
        return (
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-lg text-dark-text animate-pulse">{progressMessage}</p>
            <p className="mt-2 text-sm text-gray-500">The AI is iteratively training and evaluating models to find the best one for your data.</p>
          </div>
        );
      case 'DONE':
        return results && <ResultsDashboard results={results} onReset={handleReset} fileName={fileName} />;
      case 'ERROR':
        return (
          <div className="text-center p-8 bg-red-50 rounded-lg border border-error/50">
            <h3 className="text-2xl font-bold text-error">An Error Occurred</h3>
            <p className="text-dark-text">{error}</p>
            <button
              onClick={handleReset}
              className="mt-6 bg-accent hover:opacity-90 text-light-text font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Start Over
            </button>
          </div>
        );
      case 'IDLE':
      case 'FILE_UPLOADED':
      default:
        return (
          <FileUpload
            onFileProcessed={handleFileProcessed}
            startAnalysis={startAnalysis}
            initialState={workflowState}
            fileName={fileName}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-primary font-sans">
      <header className="bg-secondary/80 backdrop-blur-sm border-b border-highlight sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <ArtisanIcon />
            <h1 className="text-2xl font-bold text-main-text font-serif">AutoML Architect</h1>
          </div>
          <a href="https://github.com/google/genai-api-showcase/tree/main/apps/automl-architect" target="_blank" rel="noopener noreferrer" className="text-dark-text hover:text-accent transition-colors">
            <GithubIcon />
          </a>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <WorkflowStepper state={workflowState} />
          <div className="mt-8 p-4 sm:p-8 bg-secondary rounded-xl border border-highlight shadow-lg shadow-stone-200/50">
            {renderContent()}
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-dark-text text-sm">
        <p>Made by Sayed Hadi</p>
      </footer>
    </div>
  );
};

export default App;
