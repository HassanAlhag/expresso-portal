import React from 'react';

const PortfolioDescription = ({description}) => {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <p className="text-gray-700 leading-relaxed text-justify text-lg">
        {description}
      </p>
    </div>
  );
};

export default PortfolioDescription;
