import React from 'react';

const ProblemSection = ({problems}) => {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">The Challenge</h2>
      <p className="text-gray-700 leading-relaxed text-lg text-justify">
        {problems}
      </p>
    </div>
  );
};

export default ProblemSection;
