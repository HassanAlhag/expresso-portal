import React, { useState } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

const teamMembers = [
  {
    id: 1,
    name: "Nina Tapak",
    role: "Founder CEO",
    imageUrl:
      "https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-team2.jpg",
  },
  {
    id: 2,
    name: "Katie Hanna",
    role: "Designer",
    imageUrl:
      "https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-team2.jpg",
  },
  {
    id: 3,
    name: "Omi Tamak",
    role: "Developer",
    imageUrl:
      "https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-team2.jpg",
  },
  {
    id: 4,
    name: "Jacob Jones",
    role: "Project Manager",
    imageUrl:
      "https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-team2.jpg",
  },
];

const TeamSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? teamMembers.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === teamMembers.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <section
      className="py-16 bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-bg4.jpg')",
      }}
    >
      <div className="max-w-7xl mx-auto text-center px-4">
        <h3 className="text-purple-600 text-lg font-bold mb-4">Team</h3>
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
          Our Expert <span className="text-yellow-500">Team</span>
        </h2>
        <p className="mt-4 text-gray-600 text-lg">
          Our team has deep expertise across all areas of digital. Need a deep
          dive on how to set up event tracking.
        </p>

        <div className="relative mt-12 flex justify-center items-center">
          <button
            className="absolute left-0 z-10 p-3 bg-white shadow-lg rounded-full hover:bg-gray-100"
            onClick={handlePrev}
          >
            <HiOutlineChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex gap-8">
            {teamMembers.slice(currentIndex, currentIndex + 3).map((member) => (
              <div
                key={member.id}
                className="relative flex flex-col items-center justify-center"
              >
                <div className="relative w-56 h-72 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-lg bg-black group">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-xl transition-opacity duration-300">
                    <h4 className="text-white text-xl font-bold">
                      {member.name}
                    </h4>
                    <p className="text-white text-sm">{member.role}</p>
                    <div className="flex space-x-2 mt-2">
                      <a
                        href="facebook.com"
                        className="text-white hover:text-gray-300"
                      >
                        <i className="fab fa-facebook"></i>
                      </a>
                      <a
                        href="twitter.com"
                        className="text-white hover:text-gray-300"
                      >
                        <i className="fab fa-twitter"></i>
                      </a>
                      <a
                        href="behance.com"
                        className="text-white hover:text-gray-300"
                      >
                        <i className="fab fa-behance"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="absolute right-0 z-10 p-3 bg-white shadow-lg rounded-full hover:bg-gray-100"
            onClick={handleNext}
          >
            <HiOutlineChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
