import React from "react";
import { Link, useNavigate } from "react-router-dom";

const PricingContent = () => {
    const navigate = useNavigate();

    const handleContactSales = () => {
      navigate("/contact-us");
    };

  return (
    <div className="w-full bg-white p-6 shadow-none lg:w-[250px] lg:shadow-xl">
      <div className="grid grid-cols-2 lg:grid-cols-1">
        <div className="mb-3 space-y-3">
          <h3 className="font-semibold">See Our Pricing For</h3>
          <Link to="/pricing/web-dev" className="block text-sm hover:underline">
            Website Development
          </Link>
          <Link to="/pricing/seo" className="block text-sm hover:underline">
            Seo
          </Link>
          <Link to="/pricing/google-ads" className="block text-sm hover:underline">
            Google Ads
          </Link>
          <Link to="/pricing/social-media" className="block text-sm hover:underline">
            Social Media Marketing
          </Link>
        </div>
      </div>
      <button
        onClick={handleContactSales}
        className="w-full rounded-lg border-2 border-neutral-950 px-4 py-2 font-semibold transition-colors hover:bg-neutral-950 hover:text-white"
      >
        Contact Us
      </button>
    </div>
  );
};

export default PricingContent;
