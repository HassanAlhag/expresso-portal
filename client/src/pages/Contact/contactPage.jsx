// src/pages/ContactPage/ContactPage.jsx  (adjust path to your project)
import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import ContactMap from "../../components/ContactMap/contactMap";
import ContactInfoSection from "../../components/ContactInfo/contactInfo";
import { useSiteSettings } from "../../hooks/useSiteSettings";

function ContactPage() {
  const settings = useSiteSettings();

  return (
    <div>
      <ServiceBanner
        heading="Get in Touch with Us"
        subHeading="We'd love to hear from you! Whether you have questions, need assistance, or want to collaborate, our team is here to help."
        backgroundImage={settings?.contact?.heroImageUrl || "/contact-bg.jpg"}
        ctaText="View Our Works"
        ctaLink="/our-portfolio"
        badgeText="Support Available"
        badgeLink="/support"
        additionalInfo="Our team is available 24/7 to assist you with any inquiries."
      />

      <section className="bg-white px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            highlight="Contact Us"
            title="For More Information"
            description={`We’re here to help you bring your digital vision to life. Whether you need a website, social media management, SEO, or Google Ads — reach out through your preferred method below.`}
          />

          <ShiftingContactForm />
        </div>
      </section>

      <section className="bg-white px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            highlight="Need Help?"
            title="We Respond Fast"
            description={`Ask a question, request pricing, or book a call — our team will get back to you with the right next step.`}
          />

          <ContactInfoSection />
        </div>
      </section>
      <ContactMap />
    </div>
  );
}

export default ContactPage;
