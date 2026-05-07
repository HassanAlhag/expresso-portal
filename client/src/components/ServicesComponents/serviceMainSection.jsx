import React from "react";

const ServiceMainHeader = ({
  subheading,
  heading,
  desc,
  subheadingColor = "text-indigo-500",
  headingColor = "text-black",
  bgColor = "bg-white",
  descColor = "text-black",
}) => {
  return (
    <div className={`flex items-center justify-center ${bgColor} py-12`}>
      <div className="text-center">
        <h3 className={`text-sm uppercase font-semibold ${subheadingColor} mb-2`}>
          {subheading}
        </h3>
        <h1
          className={`text-3xl md:text-5xl font-bold ${headingColor} max-w-[1050px] mx-auto`}
        >
          {heading}
        </h1>
        <p className={`text-lg ${descColor} pt-8 max-w-[1150px] mx-auto`}>{desc}</p>
      </div>
    </div>
  );
};

export default ServiceMainHeader;
