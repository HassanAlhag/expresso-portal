import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { ProtfolioHeader } from "./portfolioHeader";

const Portfolio = () => {
  return (
    <div className="px-4 md:px-8 pb-8">
        <ProtfolioHeader />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full max-w-6xl mx-auto">
        <Card
          heading="Profit Assurance Technology"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem."
          imgSrc="/pat.png"
        />
        <Card
          heading="Odeur"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem. amet consectetur adipisicing elit. Cumque, exercitationem."
          imgSrc="/web-banner.jpg"
        />
        <Card
          heading="Al Safi"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem. amet consectetur adipisicing elit. Cumque, exercitationem."
          imgSrc="/web-banner.jpg"
        />
        <Card
          heading="Godfel Group"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem."
          imgSrc="/godfel.png"
        />
        <Card
          heading="Al Safi"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem. amet consectetur adipisicing elit. Cumque, exercitationem."
          imgSrc="/web-banner.jpg"
        />
        <Card
          heading="Godfel Group"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque, exercitationem."
          imgSrc="/godfel.png"
        />
      </div>
    </div>
  );
};

const Card = ({ heading, description, imgSrc }) => {
  return (
    <motion.div
      transition={{
        staggerChildren: 0.035,
      }}
      whileHover="hover"
      className="w-full h-64 bg-slate-300 overflow-hidden cursor-pointer group relative"
    >
      <div
        className="absolute inset-0 saturate-100 md:saturate-0 md:group-hover:saturate-100 group-hover:scale-110 transition-all duration-500"
        style={{
          backgroundImage: `url(${imgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="p-4 relative z-20 h-full text-slate-300 group-hover:text-white transition-colors duration-500 flex flex-col justify-between">
        <FiArrowRight className="text-3xl group-hover:-rotate-45 transition-transform duration-500 ml-auto" />
        <div>
          <h4>
            {heading.split("").map((l, i) => (
              <ShiftLetter letter={l} key={i} />
            ))}
          </h4>
          <p>{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const ShiftLetter = ({ letter }) => {
  return (
    <div className="inline-block overflow-hidden h-[36px] font-semibold text-3xl">
      <motion.span
        className="flex flex-col min-w-[4px]"
        style={{
          y: "0%",
        }}
        variants={{
          hover: {
            y: "-50%",
          },
        }}
        transition={{
          duration: 0.5,
        }}
      >
        <span>{letter}</span>
        <span>{letter}</span>
      </motion.span>
    </div>
  );
};

export default Portfolio;