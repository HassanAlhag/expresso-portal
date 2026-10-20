// src/App.js
import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Helmet } from "react-helmet";

import Header from "./components/MainHeader/header";
import Footer from "./components/Footer/footer";
import ScrollToTop from "./components/ScrollToTop/scrollToTop";
import Loader from "./components/Loader/loader";
import ErrorBoundary from "./pages/ErrorBoundary/errorBoundary"; // (keep your correct path)

const PortalRoutes = lazy(() => import("./portal/app/PortalRoutes"));

// Public pages (keep yours)
const Home = lazy(() => import("./pages/Home/home"));
const AboutUsPage = lazy(() => import("./pages/AboutUs/aboutUs"));
const PortfolioPage = lazy(() => import("./pages/Portfolio/portfolio"));
const PortfolioGalleryPage = lazy(() => import("./pages/PortfolioGallery/PortfolioGalleryPage"));
const PrtofolioSingleViewPage = lazy(() =>
  import("./pages/SingleViewPortfolio/singleViewPortfolio")
);
const ContactPage = lazy(() => import("./pages/Contact/contactPage"));
const ServiceMainPage = lazy(() => import("./pages/ServiceMain/serviceMain"));

const ServiceDetailPage = lazy(() =>
  import("./pages/Services/ServiceDetailPage")
);

const WebPricingPage = lazy(() => import("./pages/Pricing/webPricingPage"));
const SeoPricingPage = lazy(() => import("./pages/Pricing/seoPricingPage"));
const GoogleAdsPricingPage = lazy(() =>
  import("./pages/Pricing/googleAdsPage")
);
const SocialMediaPricingPage = lazy(() =>
  import("./pages/Pricing/socialMediaMarketingPage")
);

const NotFoundPage = lazy(() => import("./pages/404Page/NotFoundPage"));
const WebMarketing = lazy(() => import("./pages/WebMarketing/webMarketing"));
const ThankYouPage = lazy(() => import("./pages/ThankYou/ThankYouPage"));
const PlanBuilderPage = lazy(() =>
  import("./pages/PlanBuilder/planBuilderPage")
);


const CareerPage = lazy(() => import("./pages/Career/CareerPage"));
const ITSolutionsPage = lazy(() =>
  import("./pages/ITSolutions/ITSolutionsPage")
);
const ITSolutionDetailsPage = lazy(() =>
  import("./pages/ITSolutions/ITSolutionDetailsPage")
);
const VendorRegistrationPage = lazy(() =>
  import("./pages/VendorRegistration/VendorRegistrationPage")
);
const DigitalSolutionsPage = lazy(() =>
  import("./pages/DigitalSolutions/DigitalSolutionsPage")
);
const DigitalSolutionDetailPage = lazy(() =>
  import("./pages/DigitalSolutions/DigitalSolutionDetailPage")
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <Helmet>
          <title>
            Affordable Digital Marketing Agency in Dubai for Startups | Expresso
          </title>
          <meta
            name="description"
            content="Grow your startup with Affordable Digital Marketing Agency in Dubai for Startups. Boost rankings with expert strategies. Contact us!"
          />
        </Helmet>

        <Content />
      </ErrorBoundary>
    </Router>
  );
}

function Content() {
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");
  const hideHeaderRoutes = [
    "/marketing-solutions",
    "/greetings",
    "/vendor-registration",
  ];
  // Lets global CSS target the public website only (menus render in a portal
  // on <body>, outside the App div).
  useEffect(() => {
    document.body.dataset.surface = isPortal ? "portal" : "site";
  }, [isPortal]);

  const shouldHideHeader =
    hideHeaderRoutes.includes(location.pathname) || isPortal;

  return (
    <div className="App">
      {!shouldHideHeader && <Header />}

      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ✅ Portal handled بالكامل هنا */}
          <Route path="/portal/*" element={<PortalRoutes />} />

          {/* Public Website */}
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/case-studies" element={<PortfolioPage />} />
          <Route path="/portfolio" element={<PortfolioGalleryPage />} />
          <Route
            path="/case-studies/:id"
            element={<PrtofolioSingleViewPage />}
          />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/services" element={<ServiceMainPage />} />

          <Route path="/service/:slug" element={<ServiceDetailPage />} />

          <Route path="/pricing/web-dev" element={<WebPricingPage />} />
          <Route path="/pricing/seo" element={<SeoPricingPage />} />
          <Route
            path="/pricing/google-ads"
            element={<GoogleAdsPricingPage />}
          />
          <Route
            path="/pricing/social-media"
            element={<SocialMediaPricingPage />}
          />

          <Route path="/build-your-plan" element={<PlanBuilderPage />} />
          <Route path="/marketing-solutions" element={<WebMarketing />} />
          <Route path="/greetings" element={<ThankYouPage />} />

          <Route path="/careers" element={<CareerPage />} />
          <Route path="/it-solutions" element={<ITSolutionsPage />} />
          <Route
            path="/it-solutions/:slug"
            element={<ITSolutionDetailsPage />}
          />
          <Route path="/digital-solutions" element={<DigitalSolutionsPage />} />
          <Route
            path="/digital-solutions/:slug"
            element={<DigitalSolutionDetailPage />}
          />
          {/* Legacy CAS URL — kept working, permanently moved. */}
          <Route
            path="/products/cas"
            element={<Navigate to="/digital-solutions/cas" replace />}
          />
          <Route
            path="/vendor-registration"
            element={<VendorRegistrationPage />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {!isPortal && <Footer />}
    </div>
  );
}

export default App;
