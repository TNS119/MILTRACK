import React from 'react';

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex justify-center items-center h-full w-full p-4">
      <div 
        className={`rounded-full animate-spin border-t-[var(--accent-blue)] border-r-[var(--accent-blue)] border-b-[var(--bg-secondary)] border-l-[var(--bg-secondary)] ${sizeClasses[size]}`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
