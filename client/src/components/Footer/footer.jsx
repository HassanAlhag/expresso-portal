import React from "react";
import { Link } from "react-router-dom";
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from "react-icons/fi";

const BRAND = "#7F8AD1";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-neutral-950 text-white/80">
      {/* Background vibe (matches your header / dark hero) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(900px_circle_at_15%_20%,rgba(127,138,209,0.22),transparent_55%)]" />
        <div className="absolute inset-0 opacity-50 [background:radial-gradient(700px_circle_at_85%_70%,rgba(255,0,0,0.14),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      </div>

      <div className="relative mx-auto w-[min(1180px,94vw)] px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
              aria-label="Expresso Digital Home"
            >
              <img
                src="/white-logo.png"
                alt="Expresso Digital"
                className="h-12 w-auto object-contain"
                draggable={false}
              />
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
              Blending industry expertise with creative innovation, our team
              turns challenges into opportunities and vision into action. Let
              Expresso Digital elevate your presence and shape a brand that
              stands strong in today’s world.
            </p>

            {/* Social */}
            <div className="mt-6 flex items-center gap-3">
              <SocialIcon to="/" label="Facebook">
                <FiFacebook />
              </SocialIcon>
              <SocialIcon to="/" label="Instagram">
                <FiInstagram />
              </SocialIcon>
              <SocialIcon to="/" label="LinkedIn">
                <FiLinkedin />
              </SocialIcon>
              <SocialIcon to="/" label="Twitter">
                <FiTwitter />
              </SocialIcon>
            </div>

            {/* Mini CTA */}
            <div className="mt-8">
              <Link
                to="/contact-us"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(127,138,209,0.28)] transition hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: BRAND }}
              >
                Let’s talk
              </Link>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              {/* Services */}
              <div>
                <h5 className="text-sm font-semibold tracking-wide text-white">
                  Services
                </h5>
                <div className="mt-4 h-px w-10 bg-white/10" />
                <ul className="mt-4 space-y-2 text-sm">
                  <FooterLink to="/service/web-dev">
                    Website Development
                  </FooterLink>
                  <FooterLink to="/service/social-media-marketing">
                    Social Media Marketing
                  </FooterLink>
                  <FooterLink to="/service/seo-marketing">SEO</FooterLink>
                  <FooterLink to="/service/google-ads">Google Ads</FooterLink>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h5 className="text-sm font-semibold tracking-wide text-white">
                  Company
                </h5>
                <div className="mt-4 h-px w-10 bg-white/10" />
                <ul className="mt-4 space-y-2 text-sm">
                  <FooterLink to="/about-us">About Us</FooterLink>
                  <FooterLink to="/our-portfolio">Portfolio</FooterLink>
                  <FooterLink to="/contact-us">Contact</FooterLink>
                </ul>
              </div>

              {/* Contact */}
              <div className="col-span-2 sm:col-span-1">
                <h5 className="text-sm font-semibold tracking-wide text-white">
                  Contact
                </h5>
                <div className="mt-4 h-px w-10 bg-white/10" />

                <ul className="mt-4 space-y-2 text-sm text-white/65">
                  <li className="font-medium text-white/80">
                    Expresso Digital
                  </li>
                  <li>Office 35, Al Gaizi Plaza</li>
                  <li>Al Garhoud</li>
                  <li>Dubai, United Arab Emirates</li>

                  <li className="pt-2">
                    <a
                      href="mailto:info@expresso.ae"
                      className="underline-offset-4 hover:text-white hover:underline"
                    >
                      info@expresso.ae
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:042351500"
                      className="underline-offset-4 hover:text-white hover:underline"
                    >
                      042351500
                    </a>
                  </li>
                </ul>

                {/* Small glass card */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <p className="text-xs text-white/70">
                    Available Sun–Thu • 9:00 AM – 6:00 PM (Dubai)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Expresso Digital. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link to="/privacy" className="hover:text-white/80">
              Privacy
            </Link>
            <span className="h-3 w-px bg-white/10" />
            <Link to="/terms" className="hover:text-white/80">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="group inline-flex items-center gap-2 text-white/65 transition hover:text-white"
    >
      <span className="h-1 w-1 rounded-full bg-white/25 transition group-hover:bg-white/70" />
      {children}
    </Link>
  </li>
);

const SocialIcon = ({ to, label, children }) => (
  <Link
    to={to}
    aria-label={label}
    className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/10 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.16)] overflow-hidden z-[9999]"
  >
    <span className="text-lg">{children}</span>
  </Link>
);

export default Footer;
