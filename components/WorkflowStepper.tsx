
import React from 'react';
import type { WorkflowState } from '../types';

interface StepProps {
  title: string;
  status: 'completed' | 'active' | 'pending' | 'error';
}

const Step: React.FC<StepProps> = ({ title, status }) => {
  const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2";
  const statusClasses = {
    completed: "bg-success border-success text-white",
    active: "bg-accent border-accent text-light-text animate-pulse",
    pending: "bg-secondary border-highlight text-dark-text",
    error: "bg-error border-error text-white",
  };
  const textClasses = {
    completed: "text-success",
    active: "text-accent",
    pending: "text-dark-text",
    error: "text-error",
  }

  return (
    <div className="flex flex-col items-center relative bg-primary px-2">
      <div className={`${baseClasses} ${statusClasses[status]}`}>
        {status === 'completed' ? '✓' : status === 'error' ? '!' : ''}
      </div>
      <p className={`mt-2 text-xs sm:text-sm font-medium ${textClasses[status]}`}>{title}</p>
    </div>
  );
};

interface WorkflowStepperProps {
  state: WorkflowState;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ state }) => {
  const getStatus = (step: number): 'completed' | 'active' | 'pending' | 'error' => {
    if (state === 'ERROR') return 'error';
    const stepOrder: WorkflowState[] = ['IDLE', 'FILE_UPLOADED', 'ANALYZING', 'DONE'];
    const currentStateIndex = stepOrder.indexOf(state);

    if (currentStateIndex >= step) {
      if (state === 'DONE' && step <= 3) return 'completed';
      if(currentStateIndex === step) return 'active';
      return 'completed';
    }
    return 'pending';
  };

  const steps = ["Upload Data", "Analyze & Train", "Review Results"];

  return (
    <div className="flex justify-between items-start relative max-w-2xl mx-auto mb-8 px-4">
      <div className="absolute top-4 left-0 w-full h-0.5 bg-highlight" />
      <div
        className="absolute top-4 left-0 h-0.5 bg-accent transition-all duration-500"
        style={{ width: `${Math.max(0, (steps.indexOf(steps[state === 'ANALYZING' ? 1 : state === 'DONE' ? 2 : 0]) / (steps.length -1)) * 100)}%`}}
      />
      {steps.map((title, index) => (
        <Step key={title} title={title} status={getStatus(index + 1)} />
      ))}
    </div>
  );
};
