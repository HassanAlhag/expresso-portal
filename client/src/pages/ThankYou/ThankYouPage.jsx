import React from "react";
import { useNavigate } from "react-router-dom";

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      {/* Logo */}
      <div className="mb-10">
        <img src="/logo.png" alt="Logo" className="h-12 md:h-14 w-auto" />
      </div>

      {/* Icon */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-[#d1d5db] to-[#838FC6] rounded-2xl p-6 shadow-md inline-flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a33] leading-snug mb-4">
        Thank you for your interest, we'll get back to you <br className="hidden md:block" />
        <span className="text-black">as soon as possible.</span>
      </h1>

      <p className="text-gray-600 max-w-xl mx-auto mb-8">
        Meanwhile, feel free to explore our website to learn more about our
        services, success stories, and how we can help your business grow.
      </p>

      <button
        onClick={() => navigate("/")}
        className="bg-[#838FC6] text-white font-medium py-3 px-8 rounded-md transition hover:bg-[#6e7ab5]"
      >
        Explore More
      </button>
    </div>
  );
};

export default ThankYouPage;
