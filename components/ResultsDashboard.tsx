
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import type { AutoMLResults } from '../types';
import { CodeSnippet } from './CodeSnippet';

interface ResultsDashboardProps {
  results: AutoMLResults;
  onReset: () => void;
  fileName: string;
}

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string; actions?: React.ReactNode; }> = ({ title, children, className = '', actions }) => (
  <div className={`bg-secondary rounded-lg border border-highlight p-6 shadow-sm ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold text-accent font-serif">{title}</h3>
      {actions && <div>{actions}</div>}
    </div>
    {children}
  </div>
);

const MetricItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
  <div className="bg-primary p-4 rounded-md text-center border border-highlight">
    <p className="text-xs sm:text-sm text-dark-text whitespace-nowrap">{label}</p>
    <p className="text-xl sm:text-2xl font-bold text-main-text mt-1">{value ?? 'N/A'}</p>
  </div>
);

const ConfusionMatrix: React.FC<{ matrix: number[][]; labels: string[] }> = ({ matrix, labels }) => {
    const maxVal = matrix.flat().reduce((max, v) => v > max ? v : max, 0);
    return (
        <div className="flex flex-col items-center">
            <p className="mb-2 text-dark-text">Predicted</p>
            <div className="flex">
                <p className="transform -rotate-90 my-auto text-dark-text">Actual</p>
                <div>
                    <div className="flex ml-4">
                        {labels.map(label => <div key={label} className="w-16 text-center font-bold text-main-text">{label}</div>)}
                    </div>
                    {matrix.map((row, i) => (
                        <div key={i} className="flex items-center">
                            <div className="w-16 text-right mr-2 font-bold text-main-text">{labels[i]}</div>
                            {row.map((val, j) => (
                                <div key={j} className="w-16 h-16 flex items-center justify-center m-1 rounded-md text-lg font-semibold border border-highlight/50" style={{backgroundColor: `rgba(120, 53, 15, ${Math.max(0.05, val/maxVal)})`, color: val > maxVal/2 ? '#F5F5F4' : '#292524'}}>
                                    {val}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, onReset, fileName }) => {
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const { problemType, analysisSummary, selectedModel, evaluation, featureImportance, pythonCode } = results;
  const isClassification = problemType === 'CLASSIFICATION';
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-main-text font-serif">Analysis Complete</h2>
          <p className="text-dark-text mt-1">Results for <span className="text-accent font-medium">{fileName}</span></p>
        </div>
        <button
          onClick={onReset}
          className="bg-secondary hover:bg-accent text-dark-text hover:text-light-text font-bold py-2 px-4 rounded-lg transition-colors duration-300 border border-highlight"
        >
          Analyze New Dataset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Analysis Summary" className="lg:col-span-2">
            <p className="text-dark-text mb-4 whitespace-pre-wrap">{analysisSummary}</p>
            <div className="flex space-x-4">
                <div className="flex-1 bg-primary p-3 rounded-md border border-highlight">
                    <p className="text-sm text-dark-text">Problem Type</p>
                    <p className="text-lg font-semibold text-main-text">{problemType}</p>
                </div>
                <div className="flex-1 bg-primary p-3 rounded-md border border-highlight">
                    <p className="text-sm text-dark-text">Selected Model</p>
                    <p className="text-lg font-semibold text-main-text">{selectedModel}</p>
                </div>
            </div>
        </Card>
        
        <Card title="Feature Importance">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6D3D1" />
                <XAxis type="number" stroke="#57534E" />
                <YAxis dataKey="feature" type="category" stroke="#57534E" width={80} tick={{ fill: '#57534E', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D6D3D1', color: '#292524' }} cursor={{ fill: 'rgba(120, 53, 15, 0.1)' }}/>
                <Bar dataKey="importance" fill="#78350F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <Card title="Model Evaluation">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(evaluation.metrics).map(([key, value]) => (
             <MetricItem key={key} label={key.replace(/_/g, ' ').toUpperCase()} value={typeof value === 'number' ? value.toFixed(4) : value} />
          ))}
        </div>
        {isClassification && evaluation.confusionMatrix && evaluation.classLabels && (
            <div className="mt-6 flex justify-center">
                 <ConfusionMatrix matrix={evaluation.confusionMatrix} labels={evaluation.classLabels} />
            </div>
        )}
        {!isClassification && evaluation.scatterPlotData && (
             <div className="h-80 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D6D3D1" />
                        <XAxis type="number" dataKey="actual" name="Actual" stroke="#57534E" tick={{ fill: '#57534E' }} label={{ value: 'Actual Values', position: 'insideBottom', offset: -10, fill: '#57534E' }} />
                        <YAxis type="number" dataKey="predicted" name="Predicted" stroke="#57534E" tick={{ fill: '#57534E' }} label={{ value: 'Predicted Values', angle: -90, position: 'insideLeft', fill: '#57534E' }} />
                        <ZAxis type="number" range={[100, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D6D3D1' }}/>
                        <Scatter name="Predictions" data={evaluation.scatterPlotData} fill="#78350F" opacity={0.6}/>
                    </ScatterChart>
                </ResponsiveContainer>
             </div>
        )}
      </Card>
      
      <Card 
        title="Source Code"
        actions={
            <button
                onClick={() => setIsCodeVisible(!isCodeVisible)}
                className="bg-secondary hover:bg-gray-100 text-dark-text font-bold py-2 px-4 rounded-lg transition-colors duration-300 border border-highlight text-sm"
            >
                {isCodeVisible ? 'Hide Code' : 'Show Code'}
            </button>
        }
      >
        {isCodeVisible && <CodeSnippet code={pythonCode} />}
      </Card>

    </div>
  );
};
