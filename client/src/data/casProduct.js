// Shared copy/config for the CAS (Clinic Appointment System) product.
// Keeping this in one place means the homepage showcase, nav entries, and
// the /products/cas page all stay in sync.
//
// All claims here are grounded in functionality verified end-to-end against
// the real CAS system (CAS-01/CAS-02 evaluation waves) — patient doctor
// discovery, availability, booking, confirmation, appointment management,
// and the admin console (dashboard, appointments, doctors, schedules,
// departments, patients, role-based access). Do not add claims about SMS
// delivery, insurance/eClaimLink, payments, billing, EMR/medical records,
// multi-clinic support, or compliance certifications — none of that is
// verified, and none of it should be implied here.

export const CAS_PRODUCT = {
  name: "CAS",
  fullName: "Clinic Appointment System",
  eyebrow: "EXPRESSO PRODUCTS",
  badge: "Expresso-built product",
  shortDescription:
    "A clinic appointment platform designed and developed by Expresso Digital.",
  to: "/products/cas",
  ctaLabel: "Explore CAS",
  demoCtaLabel: "Request a Demo",
  demoHref: "/contact-us?interest=cas-demo",
  contactCtaLabel: "Talk to Expresso Digital",
  contactHref: "/contact-us",
};

// Real CAS UI captures, cropped and optimized from CAS-02D's live screenshot
// pass. Dimensions are the source WebP's intrinsic size (used to reserve
// layout space and avoid shift while images load).
export const CAS_IMAGES = {
  doctorsDesktop: {
    src: "/images/products/cas/cas-doctors-desktop.webp",
    width: 1440,
    height: 1400,
    alt: "CAS patient app showing a filterable list of doctors with specialty, duty status, and years of experience.",
  },
  doctorsMobile: {
    src: "/images/products/cas/cas-doctors-mobile.webp",
    width: 390,
    height: 1450,
    alt: "CAS patient app on a mobile screen, showing doctor search filters and a doctor listing.",
  },
  adminDashboard: {
    src: "/images/products/cas/cas-admin-dashboard.webp",
    width: 1440,
    height: 1420,
    alt: "CAS admin dashboard showing today's appointments, pending approvals, cancellations, available slots, booking statistics, and doctor availability.",
  },
  bookingSlots: {
    src: "/images/products/cas/cas-booking-slots.webp",
    width: 1440,
    height: 610,
    alt: "CAS patient app showing a doctor profile with an appointment booking panel listing available dates and time slots.",
  },
  bookingConfirmed: {
    src: "/images/products/cas/cas-booking-confirmed.webp",
    width: 1440,
    height: 900,
    alt: "CAS patient app showing a booking confirmation screen with a booking reference and visit instructions.",
  },
  adminAppointments: {
    src: "/images/products/cas/cas-admin-appointments.webp",
    width: 1440,
    height: 1380,
    alt: "CAS admin appointments list showing multiple patients with statuses including upcoming, completed, cancelled, and rescheduled.",
  },
  adminSchedule: {
    src: "/images/products/cas/cas-admin-schedule.webp",
    width: 1440,
    height: 1200,
    alt: "CAS admin doctor schedule screen showing a monthly calendar, leave management, and available appointment slots by time of day.",
  },
};

export const CAS_HERO = {
  eyebrow: "EXPRESSO PRODUCTS",
  heading: "CAS",
  descriptor: "Clinic Appointment System",
  supporting:
    "CAS connects a simple patient booking experience with the tools a clinic team needs to manage doctors, schedules, and appointments.",
};

export const CAS_PATIENT_EXPERIENCE = {
  eyebrow: "PATIENT EXPERIENCE",
  title: "Appointment booking",
  highlight: "made simpler.",
  subtitle:
    "Patients can discover doctors, view real availability, and begin the booking journey directly from the app.",
  points: [
    "Discover doctors by department, gender, and language",
    "See each doctor's specialties and experience",
    "View real appointment availability by date and time",
    "Start a booking directly from a doctor's profile",
  ],
};

export const CAS_BOOKING_JOURNEY = {
  eyebrow: "BOOKING JOURNEY",
  title: "Find a slot,",
  highlight: "confirm the visit.",
  subtitle:
    "From open availability to a confirmed appointment, in a few clear steps.",
  steps: [
    {
      label: "Find availability",
      desc: "Browse a doctor's open dates and times.",
    },
    {
      label: "Select an appointment",
      desc: "Pick the slot that works and continue.",
    },
    {
      label: "Confirm the booking",
      desc: "Get a confirmed appointment with a booking reference.",
    },
  ],
};

export const CAS_CLINIC_OPERATIONS = {
  eyebrow: "CLINIC OPERATIONS",
  title: "Operational visibility",
  highlight: "for the whole clinic.",
  subtitle:
    "The admin console gives the clinic team a live view of every appointment and its status.",
  points: [
    "Manage appointments from a single list",
    "Track status — upcoming, completed, cancelled, rescheduled",
    "Filter by doctor, status, or who the visit is booked for",
    "Keep the clinic team aligned on the day's schedule",
  ],
};

export const CAS_PROVIDER_SCHEDULING = {
  eyebrow: "PROVIDER SCHEDULING",
  title: "Manage doctor schedules",
  highlight: "and availability.",
  subtitle:
    "The clinic team can record doctor leave, block or release appointment slots, and see a full monthly calendar at a glance.",
};

export const CAS_PLATFORM_SUMMARY = {
  eyebrow: "TWO EXPERIENCES, ONE PLATFORM",
  title: "Built for patients",
  highlight: "and the clinic team alike.",
  patient: {
    title: "Patient side",
    items: ["Discover doctors", "View availability", "Book appointments", "Manage bookings"],
  },
  clinic: {
    title: "Clinic side",
    items: ["Manage doctors", "Manage schedules", "Manage appointments", "Manage patients"],
  },
};

export const CAS_BENEFITS = {
  eyebrow: "WHY IT WORKS",
  title: "Benefits grounded in",
  highlight: "how CAS actually works.",
  items: [
    {
      title: "Simpler appointment journeys",
      desc: "A clear path from finding a doctor to a confirmed booking, with no back-and-forth.",
    },
    {
      title: "Better schedule visibility",
      desc: "Up-to-date visibility into doctor availability and appointment status.",
    },
    {
      title: "Centralized clinic operations",
      desc: "Appointments, doctors, schedules, and patients managed from a single admin console.",
    },
    {
      title: "Role-based administrative access",
      desc: "Clinic team members see and manage what's relevant to their role.",
    },
  ],
};

export const CAS_BUILT_BY = {
  eyebrow: "BUILT BY EXPRESSO DIGITAL",
  title: "Designed and developed",
  highlight: "as a complete digital product.",
  description:
    "CAS is designed and developed by Expresso Digital — the same team behind the websites and campaigns we build for clients, applied to our own product.",
  capabilities: [
    "Product Design",
    "Frontend Development",
    "Backend Development",
    "Administrative Experience",
    "Data / Platform Engineering",
  ],
};

export const CAS_FINAL_CTA = {
  badge: "INTERESTED IN CAS?",
  heading: "Interested in CAS",
  headingHighlight: "for your clinic?",
  description:
    "Tell us about your clinic and we'll walk you through what CAS can do.",
  primaryLabel: "Request a Demo",
  secondaryLabel: "Talk to Our Team",
};
