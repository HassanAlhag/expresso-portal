import React from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";
import {
  SiAdobe,
  SiReact,
  SiTailwindcss,
  SiHtml5,
  SiCss3,
  SiAngular,
  SiMongodb,
  SiMysql,
  SiNodedotjs,
  SiBootstrap,
  SiCanva,
  SiGoogleanalytics,
  SiFigma,
  SiGrammarly,
  SiHootsuite,
  SiSemrush,
  SiHubspot,
  SiMailchimp,
} from "react-icons/si";
import { FaAws, FaYoast } from "react-icons/fa";

export const ServiceBanner = ({
  heading,
  subHeading,
  backgroundImage,
  overlayOpacity = 0.6,
  ctaText,
  ctaLink,
  badgeText,
  badgeText2,
  badgeLink,
}) => {
  const settings = useSiteSettings();
  const resolvedBackgroundImage = resolveWebsiteImage(settings, backgroundImage);

  return (
    <section className="overflow-hidden bg-black">
      <div
        className="relative pb-20 pt-12 md:pt-24"
        style={{
          backgroundImage: `url(${resolvedBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }}></div>
        <div className="z-50 relative flex flex-col items-center justify-center px-12 md-down:px-2 pt-12 md:pt-24">
          <Copy
            heading={heading}
            subHeading={subHeading}
            ctaText={ctaText}
            ctaLink={ctaLink}
            badgeText={badgeText}
            badgeText2={badgeText2}
            badgeLink={badgeLink}
          />
        </div>
      </div>
      <Logos />
    </section>
  );
};

const Copy = ({
  heading,
  subHeading,
  ctaText,
  ctaLink,
  badgeText,
  badgeText2
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-1.5 rounded-full bg-zinc-600">
        <button
          className="flex origin-top-left items-center rounded-full border border-zinc-900 bg-white p-0.5 text-sm transition-transform hover:-rotate-2"
        >
          <span className="rounded-full bg-[#FF6154] px-2 py-0.5 font-medium text-white">
            {badgeText}
          </span>
          <span className="ml-1.5 mr-1 inline-block">
            {badgeText2}
          </span>
          <FiArrowUpRight className="mr-2 inline-block" />
        </button>
      </div>
      <h1 className="max-w-4xl text-center text-4xl font-black leading-[1.15] md:text-6xl md:leading-[1.15] text-white">
        {heading}
      </h1>
      <p className="mx-auto my-4 max-w-3xl text-center text-white text-base leading-relaxed md:my-6 md:text-xl md:leading-relaxed">
        {subHeading}
      </p>
      <button
        className="group relative px-4 py-2 font-medium text-slate-100 transition-colors duration-[400ms] hover:text-indigo-300"
        onClick={() => navigate(ctaLink)}
      >
        <span>{ctaText}</span>
        <span className="absolute left-0 top-0 h-[2px] w-0 bg-indigo-300 transition-all duration-100 group-hover:w-full" />
        <span className="absolute right-0 top-0 h-0 w-[2px] bg-indigo-300 transition-all delay-100 duration-100 group-hover:h-full" />
        <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-indigo-300 transition-all delay-200 duration-100 group-hover:w-full" />
        <span className="absolute bottom-0 left-0 h-0 w-[2px] bg-indigo-300 transition-all delay-300 duration-100 group-hover:h-full" />
      </button>
    </>
  );
};

const Logos = () => {
  return (
    <div className="relative -mt-2 -rotate-1 scale-[1.01] border-y-2 border-zinc-900 bg-white">
      <div className="relative z-0 flex overflow-hidden border-b-2 border-zinc-900">
        <TranslateWrapper>
          <LogoItemsTop />
        </TranslateWrapper>
        <TranslateWrapper>
          <LogoItemsTop />
        </TranslateWrapper>
        <TranslateWrapper>
          <LogoItemsTop />
        </TranslateWrapper>
      </div>
      <div className="relative z-0 flex overflow-hidden">
        <TranslateWrapper reverse>
          <LogoItemsBottom />
        </TranslateWrapper>
        <TranslateWrapper reverse>
          <LogoItemsBottom />
        </TranslateWrapper>
        <TranslateWrapper reverse>
          <LogoItemsBottom />
        </TranslateWrapper>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-white to-white/0" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-white to-white/0" />
    </div>
  );
};

const TranslateWrapper = ({ children, reverse }) => {
  return (
    <motion.div
      initial={{ translateX: reverse ? "-100%" : "0%" }}
      animate={{ translateX: reverse ? "0%" : "-100%" }}
      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      className="flex px-2"
    >
      {children}
    </motion.div>
  );
};

const LogoItem = ({ Icon, name }) => {
  return (
    <span className="flex items-center justify-center gap-4 px-4 py-2 md:py-4">
      <Icon className="text-2xl text-indigo-600 md:text-3xl" />
      <span className="whitespace-nowrap text-xl font-semibold uppercase md:text-2xl">
        {name}
      </span>
    </span>
  );
};

const LogoItemsTop = () => (
  <>
    <LogoItem Icon={SiReact} name="React" />
    <LogoItem Icon={SiTailwindcss} name="Tailwind" />
    <LogoItem Icon={SiHtml5} name="HTML" />
    <LogoItem Icon={SiCss3} name="CSS" />
    <LogoItem Icon={SiAngular} name="Angular" />
    <LogoItem Icon={SiMongodb} name="MongoDb" />
    <LogoItem Icon={SiMysql} name="Mysql" />
    <LogoItem Icon={SiNodedotjs} name="Node Js" />
    <LogoItem Icon={FaAws} name="AWS" />
    <LogoItem Icon={SiBootstrap} name="Bootstrap" />
  </>
);

const LogoItemsBottom = () => (
  <>
    <LogoItem Icon={SiCanva} name="Canva" />
    <LogoItem Icon={SiAdobe} name="Adobe" />
    <LogoItem Icon={SiGoogleanalytics} name="Google Analytics" />
    <LogoItem Icon={SiFigma} name="Figma" />
    <LogoItem Icon={SiGrammarly} name="Grammarly" />
    <LogoItem Icon={SiHootsuite} name="Hootsuite" />
    <LogoItem Icon={SiSemrush} name="Semrush" />
    <LogoItem Icon={FaYoast} name="Yoast" />
    <LogoItem Icon={SiHubspot} name="Hubspot" />
    <LogoItem Icon={SiMailchimp} name="Mailchimp" />
  </>
);
