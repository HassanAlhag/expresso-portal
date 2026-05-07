import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ServiceMainHeader from "../../components/ServicesComponents/serviceMainSection";
import RevealCards from "../../components/OurServiceSection/ourServiceSection";
import WebDevelopmentProcess from "../../components/WebDevolopmentProcess/webDevelopmentProcess";
// import LogoGrid from "../../components/Clients/clients";
import ScrollingLogos from "../../components/Clients/clients";
import StackedCardTestimonials from "../../components/TestimonialSection/testimonialSection";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import ShiftingContactForm from "../../components/ContactForm/contactForm";

const cardData = [
  {
    image:
      "/creative.jpg",
    title: "Tailored, Not Templated",
    description:
      "Your business is one of a kind  your website should be too. We don’t believe in cookie-cutter designs. We dive deep into your brand story, audience behavior, and market space to build a digital experience that feels personal and performs like a pro.",
  },
  {
    image:
      "ideas.jpg",
    title: "Conversion-Focused From Click One",
    description:
      "We don’t just design for aesthetics — we design for action. With strategically placed CTAs, persuasive messaging, and user journeys that actually make sense, we help turn browsers into buyers, clicks into customers, and visits into value.",
  },
  {
    image:
      "/responsive.jpg",
    title: "Mobile-First, Always",
    description:
      " In a swipe-first world, your website needs to shine on every screen. We create responsive, lightning-fast sites that look stunning and function seamlessly,  whether on desktop, tablet, or the tiniest phone screen.",
  },
];

function ServiceMainPage() {
  return (
    <>
      <ServiceBanner
        heading="Discover Our Exceptional Services"
        subHeading="We’re not your typical digital marketing agency, we're your brand’s hype squad, growth engine, and creative powerhouse all rolled into one!"
        backgroundImage="https://demo.themenio.com/genox/images/banner-c2.jpg"
        ctaText="View Our Work"
        ctaLink="/contact-us"
        badgeText="NEW!"
        badgeLink="https://www.yourportfolio.com"
      />
      <ServiceMainHeader
        subheading="What we do"
        heading="Our team builds bold brands"
      />
      <RevealCards />
      <ServiceMainHeader
        subheading="Our Process"
        heading="Our Process: Built for Bold Brands"
        desc={
          <>
            We don’t just jump in, we dig deep. Every project starts with a curious mind, a strong coffee, and one big question: “What will move the needle for your brand?”
            <br />
            We combine strategic thinking with creative energy to turn bold ideas into campaigns that actually work. And yes, we make the process fun, collaborative, and crystal clear — so you enjoy the journey as much as the outcome.
          </>
        } />
      <WebDevelopmentProcess cards={cardData} backgroundColor="white" />
      <ServiceMainHeader
        subheading="The Dreamers. The Doers. The Disruptors."
        heading="We don’t just serve clients — we champion bold brands, daring ideas, and unstoppable visions."
        desc="Our clients are risk-takers, rule-breakers, and changemakers. They come to us when they’re ready to stop blending in and start standing out. Together, we build campaigns that don't just make noise — they echo.
              Whether you're launching, scaling, or reinventing — we become your creative ally, your growth partner, your digital hype team. Because when our clients win, we roar.
              Let’s not just work together. Let’s create something unforgettable.
              "
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
      <StackedCardTestimonials />
      <ContactUsSection
        heading="Crafting Stories Through Design"
        content="Explore a world where creativity meets precision. Each project is a testament to our passion, skill, and commitment to excellence. From concept to completion, we turn ideas into impactful realities, tailored to leave a lasting impression. Dive in and discover our journey of innovation and artistry."
      />
      <ShiftingContactForm />
    </>
  );
}

export default ServiceMainPage;
