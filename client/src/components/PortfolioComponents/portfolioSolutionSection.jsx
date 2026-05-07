import React from "react";
import { FaCheck } from "react-icons/fa";

const SolutionsSection = ({ solutions, solutionImage }) => {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Solutions</h2>
      <div className="grid grid-cols-4 gap-6 items-stretch md-down:flex md-down:flex-col">
        {/* Solutions List */}
        <div className="col-span-2 md-down:order-2">
          <ul className="space-y-4 text-gray-800 text-lg font-semibold">
            {solutions.map((solution, index) => (
              <li key={index} className="flex items-start gap-2">
                <FaCheck className="text-blue-500 mt-1" />
                <span>{solution}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Image section */}
        <div className="col-span-2 md-down:order-1 w-full">
          {solutionImage && (
            <div>
              <img
                src={solutionImage}
                alt="Solution Visual"
                className="rounded-lg w-full h-auto object-cover shadow-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionsSection;
