import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ServiceMainHeader from "../../components/ServicesComponents/serviceMainSection";
import RevealCards from "../../components/OurServiceSection/ourServiceSection";
import WebDevelopmentProcess from "../../components/WebDevolopmentProcess/webDevelopmentProcess";
import ScrollingLogos from "../../components/Clients/clients";
import StackedCardTestimonials from "../../components/TestimonialSection/testimonialSection";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import { useSiteSettings } from "../../hooks/useSiteSettings";

// ─── Service cards ────────────────────────────────────────────────────────────

const SERVICE_CARDS = [
  {
    title: "Website & App Development",
    description:
      "High-performing, conversion-first websites and apps built to look premium and load fast.",
    imgSrc: "/88.jpg",
    link: "/service/web-dev",
    tag: "WEB",
  },
  {
    title: "Social Media Management",
    description:
      "Scroll-stopping content systems + campaigns that turn attention into real customers.",
    imgSrc: "/87.jpg",
    link: "/service/social-media-marketing",
    tag: "SOCIAL",
  },
  {
    title: "SEO",
    description:
      "Rank higher, get discovered, and attract qualified organic traffic that actually converts.",
    imgSrc: "/85.jpg",
    link: "/service/seo-marketing",
    tag: "SEO",
  },
  {
    title: "Google Ads",
    description:
      "Performance-first ads with measurable ROI — high intent traffic, better leads, smarter spend.",
    imgSrc: "/86.jpg",
    link: "/service/google-ads",
    tag: "ADS",
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────

const SERVICE_TESTIMONIALS = [
  {
    img: "/godfel-logo.png",
    description:
      "Working with Expresso transformed our marketing efforts. Their innovative strategies and expert execution drove significant growth for our brand. Highly recommended!",
    name: "Felix Afram",
    title: "General Manager, Godfel Group",
  },
  {
    img: "/pat-logo.png",
    description:
      "The team at Expresso truly understands the digital landscape. Their user-focused approach helped us enhance our customer experience, making a lasting impact on our platform.",
    name: "Omar Gomma",
    title: "UX Research, Profit Assurance",
  },
  {
    img: "/floraison-logo.png",
    description:
      "Expresso's creativity and technical expertise are unmatched. They delivered a tailored solution that exceeded our expectations and drove measurable results.",
    name: "Dr. Anita George",
    title: "GP & Cosmetic Dentist",
  },
  {
    img: "/mih-logo.png",
    description:
      "Expresso is a game-changer! Their data-driven insights and marketing strategies helped us reach a wider audience and achieve our business goals.",
    name: "Dr. Yasir Ali Pullat",
    title: "Senior Dentist, Mih Dental",
  },
  {
    img: "/alb-logo.png",
    description:
      "A top-notch team at Expresso combines professionalism with creativity. They delivered an exceptional solution that aligned perfectly with our objectives.",
    name: "Daniel Henderson",
    title: "Engineering Manager, Alb Filter",
  },
  {
    img: "/aroma-logo.png",
    description:
      "Expresso's innovative approach to digital marketing has been instrumental in helping us achieve higher engagement and better ROI. Fantastic team to work with!",
    name: "Varun Devnani",
    title: "Founder",
  },
];

// ─── Process cards ────────────────────────────────────────────────────────────

const PROCESS_CARDS = [
  {
    image: "/creative.jpg",
    title: "Tailored, Not Templated",
    description:
      "Your business is one of a kind — your website should be too. We don't believe in cookie-cutter designs. We dive deep into your brand story, audience behavior, and market space to build a digital experience that feels personal and performs like a pro.",
  },
  {
    image: "/ideas.jpg",
    title: "Conversion-Focused From Click One",
    description:
      "We don't just design for aesthetics — we design for action. With strategically placed CTAs, persuasive messaging, and user journeys that actually make sense, we help turn browsers into buyers, clicks into customers, and visits into value.",
  },
  {
    image: "/responsive.jpg",
    title: "Mobile-First, Always",
    description:
      "In a swipe-first world, your website needs to shine on every screen. We create responsive, lightning-fast sites that look stunning and function seamlessly — whether on desktop, tablet, or the tiniest phone screen.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function ServiceMainPage() {
  const settings = useSiteSettings();

  return (
    <>
      <ServiceBanner
        heading="Discover Our Exceptional Services"
        subHeading="We're not your typical digital marketing agency, we're your brand's hype squad, growth engine, and creative powerhouse all rolled into one!"
        backgroundImage={settings?.services?.heroImageUrl || "https://demo.themenio.com/genox/images/banner-c2.jpg"}
        ctaText="View Our Work"
        ctaLink="/contact-us"
        badgeText="NEW!"
        badgeLink="https://www.yourportfolio.com"
      />
      <ServiceMainHeader
        subheading="What we do"
        heading="Our team builds bold brands"
      />
      <RevealCards cards={SERVICE_CARDS} />
      <ServiceMainHeader
        subheading="Our Process"
        heading="Our Process: Built for Bold Brands"
        desc={
          <>
            We don't just jump in, we dig deep. Every project starts with a curious mind, a strong coffee, and one big question: "What will move the needle for your brand?"
            <br />
            We combine strategic thinking with creative energy to turn bold ideas into campaigns that actually work. And yes, we make the process fun, collaborative, and crystal clear — so you enjoy the journey as much as the outcome.
          </>
        }
      />
      <WebDevelopmentProcess cards={PROCESS_CARDS} backgroundColor="white" />
      <ServiceMainHeader
        subheading="The Dreamers. The Doers. The Disruptors."
        heading="We don't just serve clients — we champion bold brands, daring ideas, and unstoppable visions."
        desc="Our clients are risk-takers, rule-breakers, and changemakers. They come to us when they're ready to stop blending in and start standing out. Together, we build campaigns that don't just make noise — they echo.
              Whether you're launching, scaling, or reinventing — we become your creative ally, your growth partner, your digital hype team. Because when our clients win, we roar.
              Let's not just work together. Let's create something unforgettable."
        bgColor="bg-gray-900"
        headingColor="text-white"
        descColor="text-gray-300"
      />
      <ScrollingLogos />
      <ServiceMainHeader
        subheading="Testimonials"
        heading="We know the best results come from bold ideas. We enjoy what we do and we want you to too."
        headingColor="text-black"
      />
      <StackedCardTestimonials testimonials={SERVICE_TESTIMONIALS} />
      <ContactUsSection
        heading="Crafting Stories Through Design"
        content="Explore a world where creativity meets precision. Each project is a testament to our passion, skill, and commitment to excellence. From concept to completion, we turn ideas into impactful realities, tailored to leave a lasting impression. Dive in and discover our journey of innovation and artistry."
      />
      <ShiftingContactForm />
    </>
  );
}

export default ServiceMainPage;
