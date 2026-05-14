import React, { useRef } from "react";
import { useScroll } from "framer-motion";
import { FaLinkedin } from "react-icons/fa";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

export const DEFAULT_TEAM_MEMBERS = [
  {
    key: "mohamed",
    image: "/manager.webp",
    name: "Mohamed Bashir",
    position: "Head of Business Development",
    description:
      "Driving partnerships and uncovering growth opportunities to expand business reach and impact.",
    socialMedia: {
      linkedin: "https://www.linkedin.com/in/mohamed-bashir-b8105928/",
    },
  },
  {
    key: "hassan",
    image: "/hassan.webp",
    name: "Hassan (Elhag) Omer Ahmed Omer",
    position: "Digital & Social Media Analyst",
    description:
      "Turning digital data into actionable insights to optimize brand performance across platforms.",
    socialMedia: {
      linkedin: "https://www.linkedin.com/in/hassanalhag/",
    },
  },
  {
    key: "swekshya",
    image: "/swekshya.webp",
    name: "Swekshya Basnet",
    position: "HR & Finance",
    description:
      "Ensuring financial health through smart planning, risk management, and strategic investments.",
    socialMedia: {
      linkedin: "https://www.linkedin.com/in/swekshya-basnet-a10444158/",
    },
  },
  {
    key: "afrid",
    image: "/11.webp",
    name: "Afrid Ahamed",
    position: "Social Media Stratergist",
    description:
      "Designing actionable strategies that align business goals with market trends and user needs.",
    socialMedia: {
      linkedin: "https://www.linkedin.com/in/-afrid-ahamed/",
    },
  },
  {
    key: "nazim",
    image: "/gal2.webp",
    name: "Mohammed Nazim",
    position: "Marketing Advisor",
    description:
      "Shaping impactful marketing strategies that build strong brand presence and engagement.",
    socialMedia: {
      linkedin: "www.linkedin.com/in/nazimrasheed",
    },
  },
  {
    key: "saad",
    image: "/saad.webp",
    name: "Saad",
    position: "SEO Specialist",
    description:
      "Crafting marketing campaigns that connect brands with their audience authentically.",
    socialMedia: {
      linkedin: "https://www.linkedin.com/in/saadsalman37/",
    },
  },
  {
    key: "yasir",
    image: "/10.webp",
    name: "Muhammed Yasir",
    position: "Web Developer",
    description:
      "Building high-performing web solutions with clean architecture, seamless UI, and optimal speed.",
    socialMedia: {
      linkedin: "https://www.linkedin.com/in/muhammed-yasir-m-115943215/",
    },
  },
];

export const DisappearingFeatures = ({
  members = DEFAULT_TEAM_MEMBERS,
  sectionBadge = "MEET THE TEAM",
  sectionHeading = "Connect and Excel with Our",
  sectionHeadingHighlight = "Trusted Experts",
  sectionBody = "Discover the people who drive our success and make a difference. Scroll through to meet our experts and learn their unique stories.",
}) => {
  return (
    <>
      <div id="team" className="relative h-fit bg-gray-900">
        <Features
          members={members}
          sectionBadge={sectionBadge}
          sectionHeading={sectionHeading}
          sectionHeadingHighlight={sectionHeadingHighlight}
          sectionBody={sectionBody}
        />
      </div>
    </>
  );
};

const Features = ({ members, sectionBadge, sectionHeading, sectionHeadingHighlight, sectionBody }) => {
  return (
    <div className="relative mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-2">
      <Copy
        badge={sectionBadge}
        heading={sectionHeading}
        headingHighlight={sectionHeadingHighlight}
        body={sectionBody}
      />
      <Carousel members={members} />
    </div>
  );
};

const Copy = ({ badge, heading, headingHighlight, body }) => {
  return (
    <div className="flex h-fit w-full flex-col justify-center py-12 md:sticky md:top-0 md:h-screen">
      <span className="w-fit rounded-full border border-white/12 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/78 backdrop-blur">
        {badge}
      </span>
      <h2 className="mb-6 mt-8 max-w-4xl font-dax-compact text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
        {heading}{" "}
        <span className="text-[#7F8AD1]">{headingHighlight}</span>
      </h2>
      <p className="max-w-3xl text-lg leading-relaxed text-white/70 sm:text-xl">
        {body}
      </p>
    </div>
  );
};

const Carousel = ({ members }) => {
  const settings = useSiteSettings();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  return (
    <div className="relative w-full">
      <Gradient />

      <div ref={ref} className="relative z-0 flex flex-col gap-6 md:gap-12">
        {members.map((member, index) => (
          <CarouselItem
            key={index}
            scrollYProgress={scrollYProgress}
            position={index + 1}
            numItems={members.length}
            story={{
              ...member,
              image: resolveWebsiteImage(settings, member.image),
            }}
          />
        ))}
      </div>

      <Buffer />
    </div>
  );
};

const CarouselItem = ({ story }) => {
  return (
    <div className="group relative w-full h-[400px] shrink-0 [perspective:1000px]">
      <div className="relative h-full w-full rounded-xl shadow-xl transition-transform duration-500 overflow-hidden">
        <img
          src={story.image}
          alt={story.name}
          className="absolute inset-0 h-full w-full object-cover rounded-xl transition-all duration-500 group-hover:blur-sm"
        />

        <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-t from-black/70 via-black/50 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl">
          <h3 className="text-xl font-bold">{story.name}</h3>
          <p className="text-sm italic mb-2">{story.position}</p>
          <p className="text-sm text-center px-14">{story.description}</p>

          <div className="flex space-x-4 mt-4">
            <a
              href={story.socialMedia.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 hover:scale-110 transition-transform"
            >
              <FaLinkedin />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const Gradient = () => (
  <div className="sticky top-0 z-10 hidden h-24 w-full bg-gradient-to-b from-gray-900 to-gray-900/0 md:block" />
);

const Buffer = () => <div className="h-24 w-full md:h-48" />;
