import React from "react";

const HeroSection = () => {
  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat py-16"
      style={{
        backgroundImage: `url('https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-bg6.jpg')`,
      }}
    >
      <div className="max-w-[1100px] mx-auto px-4 flex lg-down:flex-col items-center gap-28">
        <div className="md:w-1/2">
          <h3 className="text-purple-700 text-lg font-bold mb-2">We are Expresso</h3>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            We want to give you the <span className="text-gradient">best service</span>
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Our team has deep expertise across all areas of digital. Need a deep dive on how to set up event tracking for a complex lead process? Want to optimize your sales pipeline.
          </p>

          <div className="flex gap-6 mt-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-100 p-4 rounded-full shadow">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4290/4290854.png"
                  alt="Best Planning"
                  className="w-10 h-10"
                />
              </div>
              <p className="text-sm mt-2 font-semibold">Best planning</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-100 p-4 rounded-full shadow">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4290/4290892.png"
                  alt="Money Back"
                  className="w-10 h-10"
                />
              </div>
              <p className="text-sm mt-2 font-semibold">Money back</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-100 p-4 rounded-full shadow">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4290/4290898.png"
                  alt="Trusted"
                  className="w-10 h-10"
                />
              </div>
              <p className="text-sm mt-2 font-semibold">100% Trusted</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Business Skill</p>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-pink-500 h-2 rounded"
                  style={{ width: "95%" }}
                ></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Customer Service</p>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-purple-500 h-2 rounded"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
          <div className="relative">
            <img
              src="https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-team2.jpg"
              alt="Team"
              className="rounded-lg shadow-lg"
            />
            <div className="absolute bottom-[-20px] left-[-20px] bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm">Years of</p>
              <h2 className="text-4xl font-bold">12+</h2>
              <p className="text-sm">Experiences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
