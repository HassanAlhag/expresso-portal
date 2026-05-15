import React from 'react';

const ClientInfoCard = ({ clientName, category, startDate, endDate }) => {
  return (
    <div className="border-2 rounded-lg border-gradient-to-r from-blue-500 to-teal-500 p-4 max-w-5xl mx-auto my-6">
      <div className="grid grid-cols-2 gap-4 text-center text-gray-800 sm:grid-cols-4">
        <div>
          <h4 className="font-semibold text-lg">Client:</h4>
          <p className="text-sm text-gray-600">{clientName}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg">Category:</h4>
          <p className="text-sm text-gray-600">{category}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg">Start Date:</h4>
          <p className="text-sm text-gray-600">{startDate}</p>
        </div>
        <div>
          <h4 className="font-semibold text-lg">End Date:</h4>
          <p className="text-sm text-gray-600">{endDate}</p>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoCard;
