import React, { lazy, Suspense, useEffect, useState } from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ServiceMainHeader from "../../components/ServicesComponents/serviceMainSection";
import RevealCards from "../../components/OurServiceSection/ourServiceSection";
import WebDevelopmentProcess from "../../components/WebDevolopmentProcess/webDevelopmentProcess";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage, toWebsiteImageUrl } from "../../utils/websiteImages";

const ScrollingLogos = lazy(() => import("../../components/Clients/clients"));
const StackedCardTestimonials = lazy(() => import("../../components/TestimonialSection/testimonialSection"));
const ContactUsSection = lazy(() => import("../../components/ContactUsSection/contactSection"));
const ShiftingContactForm = lazy(() => import("../../components/ContactForm/contactForm"));

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

const DEFAULT_SERVICES_PAGE_COPY = {
  heroHeading: "Discover Our Exceptional Services",
  heroSubheading:
    "We're not your typical digital marketing agency, we're your brand's hype squad, growth engine, and creative powerhouse all rolled into one!",
  introSubheading: "What we do",
  introHeading: "Our team builds bold brands",
  processSubheading: "Our Process",
  processHeading: "Our Process: Built for Bold Brands",
  processDescription:
    "We don't just jump in, we dig deep. Every project starts with a curious mind, a strong coffee, and one big question: \"What will move the needle for your brand?\" We combine strategic thinking with creative energy to turn bold ideas into campaigns that actually work. And yes, we make the process fun, collaborative, and crystal clear — so you enjoy the journey as much as the outcome.",
  clientsSubheading: "The Dreamers. The Doers. The Disruptors.",
  clientsHeading:
    "We don't just serve clients — we champion bold brands, daring ideas, and unstoppable visions.",
  clientsDescription:
    "Our clients are risk-takers, rule-breakers, and changemakers. They come to us when they're ready to stop blending in and start standing out. Together, we build campaigns that don't just make noise — they echo. Whether you're launching, scaling, or reinventing — we become your creative ally, your growth partner, your digital hype team. Because when our clients win, we roar. Let's not just work together. Let's create something unforgettable.",
  testimonialsSubheading: "Testimonials",
  testimonialsHeading:
    "We know the best results come from bold ideas. We enjoy what we do and we want you to too.",
  contactHeading: "Crafting Stories Through Design",
  contactContent:
    "Explore a world where creativity meets precision. Each project is a testament to our passion, skill, and commitment to excellence. From concept to completion, we turn ideas into impactful realities, tailored to leave a lasting impression. Dive in and discover our journey of innovation and artistry.",
};

function pageCopy(settings = {}, key) {
  return settings[key] || DEFAULT_SERVICES_PAGE_COPY[key];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ServiceMainPage() {
  const settings = useSiteSettings();
  const servicesSettings = settings?.services || {};
  const [serviceCards, setServiceCards] = useState(null);

  useEffect(() => {
    fetch("/api/web-content/services")
      .then((r) => r.json())
      .then((d) => setServiceCards(d.items || []))
      .catch(() => setServiceCards([]));
  }, []);

  const cards = serviceCards
    ? serviceCards.map((s) => ({
        title: s.title,
        description: s.description,
        imgSrc: s.imageUrl,
        link: s.slug ? `/service/${s.slug}` : "/services",
        tag: s.tag,
      }))
    : undefined;
  const heroFallback = "https://demo.themenio.com/genox/images/banner-c2.jpg";
  const heroImage = servicesSettings.heroImageUrl
    ? toWebsiteImageUrl(servicesSettings.heroImageUrl)
    : resolveWebsiteImage(settings, heroFallback);

  return (
    <>
      <ServiceBanner
        heading={pageCopy(servicesSettings, "heroHeading")}
        subHeading={pageCopy(servicesSettings, "heroSubheading")}
        backgroundImage={heroImage}
        ctaText="View Our Work"
        ctaLink="/contact-us"
        badgeText="NEW!"
        badgeLink="https://www.yourportfolio.com"
      />
      <ServiceMainHeader
        subheading={pageCopy(servicesSettings, "introSubheading")}
        heading={pageCopy(servicesSettings, "introHeading")}
      />
      <RevealCards cards={cards} />
      <ServiceMainHeader
        subheading={pageCopy(servicesSettings, "processSubheading")}
        heading={pageCopy(servicesSettings, "processHeading")}
        desc={pageCopy(servicesSettings, "processDescription")}
      />
      <WebDevelopmentProcess cards={PROCESS_CARDS} backgroundColor="white" />
      <ServiceMainHeader
        subheading={pageCopy(servicesSettings, "clientsSubheading")}
        heading={pageCopy(servicesSettings, "clientsHeading")}
        desc={pageCopy(servicesSettings, "clientsDescription")}
        bgColor="bg-gray-900"
        headingColor="text-white"
        descColor="text-gray-300"
      />
      <Suspense fallback={null}>
        <ScrollingLogos />
      </Suspense>
      <ServiceMainHeader
        subheading={pageCopy(servicesSettings, "testimonialsSubheading")}
        heading={pageCopy(servicesSettings, "testimonialsHeading")}
        headingColor="text-black"
      />
      <Suspense fallback={null}>
        <StackedCardTestimonials testimonials={SERVICE_TESTIMONIALS} />
        <ContactUsSection
          heading={pageCopy(servicesSettings, "contactHeading")}
          content={pageCopy(servicesSettings, "contactContent")}
        />
        <ShiftingContactForm />
      </Suspense>
    </>
  );
}

export default ServiceMainPage;
