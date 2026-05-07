import React, { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const OurSolutionsComponent = () => {
  const [expandedUnified, setExpandedUnified] = useState(false);
  const [expandedContact, setExpandedContact] = useState(false);
  const [expandedIT, setExpandedIT] = useState(false);

  const handleNavigation = (path) => {
    console.log(`Navigating to: ${path}`);
  };

  return (
    <div className="grid h-fit w-full grid-cols-12 shadow-xl lg:h-72 lg:w-[600px] lg:shadow-none xl:w-[750px]">
      <div className="col-span-12 flex flex-col justify-between bg-neutral-950 p-6 lg:col-span-4">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">Our Solutions</h2>
          <p className="mb-6 max-w-xs text-sm text-neutral-400">
            Placeholder is the world's leading placeholder company.
          </p>
        </div>
        <button
          onClick={() => handleNavigation("/learn-more")}
          className="flex items-center gap-1 text-xs text-indigo-300 hover:underline"
        >
          Learn more <FiArrowRight />
        </button>
      </div>

      <div className="col-span-12 grid grid-cols-2 grid-rows-2 gap-3 bg-white p-6 lg:col-span-8 relative cursor-pointer">
        <div
          className="relative rounded border-2 border-neutral-200 bg-white p-3 hover:bg-neutral-100 transition-colors"
          onMouseEnter={() => setExpandedUnified(true)}
          onMouseLeave={() => setExpandedUnified(false)}
        >
          <h3 className="mb-1 font-semibold">Unified Communication</h3>
          <p className="text-xs">
            Streamline your communication with scalable solutions.
          </p>

          <AnimatePresence>
            {expandedUnified && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-3"
              >
                <Link
                  to="/solutions/avaya"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 text-sm hover:bg-neutral-100"
                >
                  Avaya
                </Link>
                <Link
                  to="/solutions/avaya-aura"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 mt-2 text-sm hover:bg-neutral-100"
                >
                  Avaya Aura
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div
          className="relative rounded border-2 border-neutral-200 bg-white p-3 hover:bg-neutral-100 transition-colors"
          onMouseEnter={() => setExpandedContact(true)}
          onMouseLeave={() => setExpandedContact(false)}
        >
          <h3 className="mb-1 font-semibold">Contact Centres Solutions</h3>
          <p className="text-xs">
            Enhance customer interactions with tailored contact center tools.
          </p>

          <AnimatePresence>
            {expandedContact && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-3"
              >
                <Link
                  to="/solutions/avaya-contact-center"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 text-sm hover:bg-neutral-100"
                >
                  Avaya Contact Center Solutions
                </Link>
                <Link
                  to="/solutions/digital-contact-center"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 mt-2 text-sm hover:bg-neutral-100"
                >
                  Digital Contact Center Solutions
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          to="/solutions/crm-erp"
          className="rounded border-2 border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-100"
        >
          <h3 className="mb-1 font-semibold">CRM & ERP</h3>
          <p className="text-xs">
            Optimize your operations with efficient CRM and ERP platforms.
          </p>
        </Link>

        <div
          className="relative rounded border-2 border-neutral-200 bg-white p-3 hover:bg-neutral-100 transition-colors"
          onMouseEnter={() => setExpandedIT(true)}
          onMouseLeave={() => setExpandedIT(false)}
        >
          <h3 className="mb-1 font-semibold">IT Infrastructure Solutions</h3>
          <p className="text-xs">
            Secure and scalable IT infrastructure tailored to your needs.
          </p>

          <AnimatePresence>
            {expandedIT && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-3"
              >
                <Link
                  to="/solutions/network-firewalls"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 text-sm hover:bg-neutral-100"
                >
                  Network and Firewalls
                </Link>
                <Link
                  to="/solutions/wifi-solutions"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 mt-2 text-sm hover:bg-neutral-100"
                >
                  Wifi Solutions
                </Link>
                <Link
                  to="/solutions/managed-it-services"
                  className="block rounded border-2 border-neutral-200 bg-white p-2 mt-2 text-sm hover:bg-neutral-100"
                >
                  Managed IT Services
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OurSolutionsComponent;
