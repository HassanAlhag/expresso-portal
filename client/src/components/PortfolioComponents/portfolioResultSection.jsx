import React from 'react';

const ResultSection = ({result}) => {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Result</h2>
      <p className="text-gray-700 leading-relaxed text-lg text-justify">
        {result}
      </p>
    </div>
  );
};

export default ResultSection;
