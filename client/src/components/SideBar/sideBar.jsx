import React from 'react';
import { Close } from '@carbon/icons-react';
import { FaFacebook, FaInstagram, FaTwitter, FaBehance } from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 w-full h-full bg-black text-white px-8 py-10 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } transition-transform duration-700 ease-in-out z-50`}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <img
                            src="https://expressotelecom.ae/wp-content/uploads/2023/07/logo-expresso-entrprise-white.png"
                            alt="Expresso Logo"
                            className="w-36"
                        />
                    </div>
                    <button onClick={toggleSidebar}>
                        <Close size={28} className="cursor-pointer text-white" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-6 text-2xl font-bold tracking-wide">
                    <a href="/" className="hover:text-gray-300">HOME</a>
                    <a href="/expertise" className="hover:text-gray-300">OUR EXPERTISE</a>
                    <a href="/services" className="hover:text-gray-300">SERVICES</a>
                    <a href="/solutions" className="hover:text-gray-300">SOLUTIONS</a>
                    <a href="/discover" className="hover:text-gray-300">DISCOVER</a>
                    <a href="/contact" className="hover:text-gray-300">LET'S CONNECT</a>
                    <a href="/login" className="hover:text-gray-300">LOGIN</a>
                </nav>

                {/* Contact Information */}
                <div className="mt-10">
                    <h3 className="text-xl font-bold mb-4">Expresso Business Solutions</h3>
                    <p className="text-gray-400 mb-2">
                        Office: 408, Al Owais Building – Al Ittihad Rd – Dubai
                    </p>
                    <p className="text-gray-400 mb-2">info@expresso.ae</p>
                    <p className="text-gray-400 mb-2">+971 (0) 4-235-1500</p>
                </div>

                {/* Social Media Links */}
                <div className="flex gap-6 mt-6">
                    <FaFacebook className="w-6 h-6 cursor-pointer hover:text-gray-400" />
                    <FaInstagram className="w-6 h-6 cursor-pointer hover:text-gray-400" />
                    <FaTwitter className="w-6 h-6 cursor-pointer hover:text-gray-400" />
                    <FaBehance className="w-6 h-6 cursor-pointer hover:text-gray-400" />
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleSidebar}
                ></div>
            )}
        </>
    );
};

export default Sidebar;
