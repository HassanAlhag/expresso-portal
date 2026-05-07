// src/App.js
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
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
const PrtofolioSingleViewPage = lazy(() =>
  import("./pages/SingleViewPortfolio/singleViewPortfolio")
);
const ContactPage = lazy(() => import("./pages/Contact/contactPage"));
const ServiceMainPage = lazy(() => import("./pages/ServiceMain/serviceMain"));

const SeoMarketingPage = lazy(() => import("./pages/Services/seo-marketing"));
const VideographyPage = lazy(() => import("./pages/Services/videography"));
const ContentCreationPage = lazy(() =>
  import("./pages/Services/content-creation")
);
const SocialMediaMarketingPage = lazy(() =>
  import("./pages/Services/social-media-marketing")
);
const GoogleAdsPage = lazy(() => import("./pages/Services/google-ads"));
const WebsiteDevelopmentPage = lazy(() =>
  import("./pages/Services/webiste-dev")
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

const ProductionsPage = lazy(() =>
  import("./features/productions/pages/ProductionsPage")
);
const ProductionDetailsPage = lazy(() =>
  import("./features/productions/pages/ProductionDetailsPage")
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
          <Route path="/our-portfolio" element={<PortfolioPage />} />
          <Route
            path="/portfolio/detail/:id"
            element={<PrtofolioSingleViewPage />}
          />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/services" element={<ServiceMainPage />} />

          <Route path="/service/seo-marketing" element={<SeoMarketingPage />} />
          <Route path="/service/videography" element={<VideographyPage />} />
          <Route
            path="/service/content-creation"
            element={<ContentCreationPage />}
          />
          <Route
            path="/service/social-media-marketing"
            element={<SocialMediaMarketingPage />}
          />
          <Route path="/service/google-ads" element={<GoogleAdsPage />} />
          <Route path="/service/web-dev" element={<WebsiteDevelopmentPage />} />

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

          <Route path="/productions" element={<ProductionsPage />} />
          <Route
            path="/productions/:slug"
            element={<ProductionDetailsPage />}
          />

          <Route path="/careers" element={<CareerPage />} />
          <Route path="/it-solutions" element={<ITSolutionsPage />} />
          <Route
            path="/it-solutions/:slug"
            element={<ITSolutionDetailsPage />}
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
