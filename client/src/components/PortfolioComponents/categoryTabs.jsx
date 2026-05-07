import React, { useState } from "react";

const categories = ["All", "Business", "Development", "Digital", "Photography", "Service"];

const CategoryTabs = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="flex justify-center items-center space-x-8 p-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setActiveCategory(category)}
          className={`relative text-lg font-medium text-gray-600 ${
            activeCategory === category ? "text-black" : ""
          }`}
        >
          {category}
          {activeCategory === category && (
            <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-6 h-1 bg-orange-500 rounded-full"></span>
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
