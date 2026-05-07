import React from 'react';
import { HiMenuAlt3 } from "react-icons/hi"; // Menu icon
import { FaWhatsapp } from "react-icons/fa"; // WhatsApp icon

const LeftMenuBar = ({ toggleSidebar }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-black flex flex-col justify-between items-center py-6 z-50">
      {/* Logo */}
      <div>
        <img
          src="/logo.png"
          alt="Logo"
          className="w-full h-auto"
        />
      </div>

      {/* Menu Icon */}
      <button onClick={toggleSidebar} className="text-white hover:text-gray-400 cursor-pointer">
        <HiMenuAlt3 size={28} />
      </button>

      {/* WhatsApp Icon */}
      <a
        href="https://wa.me/yourwhatsapplink" // Replace with your WhatsApp link
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-green-400"
      >
        <FaWhatsapp size={28} />
      </a>
    </div>
  );
};

export default LeftMenuBar;
