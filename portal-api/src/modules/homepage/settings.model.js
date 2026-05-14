import mongoose from "mongoose";

function imgField() {
  return {
    url: { type: String, default: "" },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
  };
}

const siteSettingsSchema = new mongoose.Schema(
  {
    // One singleton document – always upserted with _id: "site"
    _id: { type: String, default: "site" },

    branding: {
      logoUrl: { type: String, default: "" },
      logoMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      logoWhiteUrl: { type: String, default: "" },
      logoWhiteMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      faviconUrl: { type: String, default: "" },
      faviconMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      ogImageUrl: { type: String, default: "" },
      ogImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    home: {
      heroVideoUrl: { type: String, default: "" },
      heroBannerUrl: { type: String, default: "" },
      heroBannerMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    homepageSections: {
      aboutImageUrl: { type: String, default: "" },
      aboutImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      servicesImageUrl: { type: String, default: "" },
      servicesImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    about: {
      heroImageUrl: { type: String, default: "" },
      heroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamPhotoUrl: { type: String, default: "" },
      teamPhotoMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      missionImageUrl: { type: String, default: "" },
      missionImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      missionDeviceImageUrl: { type: String, default: "" },
      missionDeviceImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      blueprintCustomerImageUrl: { type: String, default: "" },
      blueprintCustomerImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      blueprintInnovationImageUrl: { type: String, default: "" },
      blueprintInnovationImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      blueprintQualityImageUrl: { type: String, default: "" },
      blueprintQualityImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamMohamedImageUrl: { type: String, default: "" },
      teamMohamedImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamHassanImageUrl: { type: String, default: "" },
      teamHassanImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamSwekshyaImageUrl: { type: String, default: "" },
      teamSwekshyaImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamAfridImageUrl: { type: String, default: "" },
      teamAfridImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamNazimImageUrl: { type: String, default: "" },
      teamNazimImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamSaadImageUrl: { type: String, default: "" },
      teamSaadImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      teamYasirImageUrl: { type: String, default: "" },
      teamYasirImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    services: {
      heroImageUrl: { type: String, default: "" },
      heroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      sectionBgUrl: { type: String, default: "" },
      sectionBgMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    portfolio: {
      heroImageUrl: { type: String, default: "" },
      heroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    careers: {
      heroImageUrl: { type: String, default: "" },
      heroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      officeImageUrl: { type: String, default: "" },
      officeImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    contact: {
      heroImageUrl: { type: String, default: "" },
      heroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      officeImageUrl: { type: String, default: "" },
      officeImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    // Generic replacement map for legacy/default public website images.
    websiteImages: {
      images: [
        {
          key: { type: String, default: "" },
          url: { type: String, default: "" },
          mediaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
            default: null,
          },
        },
      ],
    },

    // Homepage draggable gallery (up to 8 images)
    gallery: {
      images: [
        {
          url: { type: String, default: "" },
          mediaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
            default: null,
          },
          alt: { type: String, default: "" },
        },
      ],
    },

    itSolutions: {
      heroImageUrl: { type: String, default: "" },
      heroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      softwareLicensingHeroImageUrl: { type: String, default: "" },
      softwareLicensingHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      erpSolutionHeroImageUrl: { type: String, default: "" },
      erpSolutionHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      crmSolutionHeroImageUrl: { type: String, default: "" },
      crmSolutionHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      queueManagementHeroImageUrl: { type: String, default: "" },
      queueManagementHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      iotSolutionsHeroImageUrl: { type: String, default: "" },
      iotSolutionsHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      vasSolutionsHeroImageUrl: { type: String, default: "" },
      vasSolutionsHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      cloudServicesHeroImageUrl: { type: String, default: "" },
      cloudServicesHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      webHostingDomainsHeroImageUrl: { type: String, default: "" },
      webHostingDomainsHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      dataCenterHeroImageUrl: { type: String, default: "" },
      dataCenterHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      itConsultationHeroImageUrl: { type: String, default: "" },
      itConsultationHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      networkingHardwareHeroImageUrl: { type: String, default: "" },
      networkingHardwareHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },

      dataCenterHardwareHeroImageUrl: { type: String, default: "" },
      dataCenterHardwareHeroImageMediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    // Scrolling marquee brand strip (up to 10 brands)
    marquee: {
      brands: [
        {
          label: { type: String, default: "" },
          imageUrl: { type: String, default: "" },
          mediaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
            default: null,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", siteSettingsSchema);
