import React from "react";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom"; // Use if React Router is available

const CareersContent = () => {
  const handleNavigation = (path) => {
    // Replace this with your navigation logic
    console.log(`Navigate to: ${path}`);
  };

  return (
    <div className="grid w-full grid-cols-12 shadow-xl lg:w-[750px]">
      <div className="col-span-12 flex flex-col justify-between bg-indigo-600 p-6 lg:col-span-4">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-white">Careers</h2>
          <p className="text-sm text-indigo-100">
            Placeholder was rated a top place to work by Placeholder.
          </p>
        </div>
        <button
          onClick={() => handleNavigation("/careers")}
          className="flex items-center gap-1 text-xs text-indigo-200 hover:underline"
        >
          Careers site <FiArrowRight />
        </button>
      </div>
      <div className="col-span-12 grid grid-cols-2 gap-3 bg-white p-6 lg:col-span-8 lg:grid-cols-3">
        <div className="space-y-3">
          <h3 className="font-semibold">Business</h3>
          <Link to="/marketing" className="block text-sm hover:underline">
            Marketing
          </Link>
          <Link to="/finance" className="block text-sm hover:underline">
            Finance
          </Link>
          <Link to="/legal" className="block text-sm hover:underline">
            Legal
          </Link>
          <Link to="/sales" className="block text-sm hover:underline">
            Sales
          </Link>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Engineering</h3>
          <Link to="/full-stack" className="block text-sm hover:underline">
            Full stack
          </Link>
          <Link to="/dev-ops" className="block text-sm hover:underline">
            Dev ops
          </Link>
          <Link to="/qa" className="block text-sm hover:underline">
            QA
          </Link>
          <Link to="/data" className="block text-sm hover:underline">
            Data
          </Link>
          <Link
            to="/machine-learning"
            className="block text-sm hover:underline"
          >
            Machine learning
          </Link>
          <Link to="/management" className="block text-sm hover:underline">
            Management
          </Link>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">More</h3>
          <Link to="/support" className="block text-sm hover:underline">
            Support
          </Link>
          <Link to="/office" className="block text-sm hover:underline">
            Office
          </Link>
          <Link to="/other" className="block text-sm hover:underline">
            Other
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CareersContent;
