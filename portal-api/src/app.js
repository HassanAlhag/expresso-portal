import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";

import authRoutes from "./modules/iam/auth/auth.routes.js";
import iamUsersRoutes from "./modules/iam/users/user.routes.js";
import rolesRoutes from "./modules/iam/roles/role.routes.js";
import invitesRoutes from "./modules/iam/invites/invite.routes.js";
import ticketRoutes from "./modules/tickets/ticket.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import serviceTemplateRoutes from "./modules/services/serviceTemplate.routes.js";
import customersRoutes from "./modules/customers/customers.routes.js";
import portfolioRoutes from "./modules/portfolio/portfolio.routes.js";
import mediaRoutes from "./modules/content/media/media.routes.js";
import productionRoutes from "./modules/content/productions/production.routes.js";
import jobsRoutes from "./modules/content/jobs/job.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import filesRoutes from "./modules/files/files.routes.js";
import auditRoutes from "./modules/iam/audit/audit.routes.js";
import teamsRoutes from "./modules/iam/teams/team.routes.js";
import enrollmentsRoutes from "./modules/enrollments/enrollment.routes.js";

import dealRoutes from "./modules/crm/deals/deal.routes.js";
import leadRoutes from "./modules/crm/leads/lead.routes.js";
import accountsRoutes from "./modules/crm/accounts/account.routes.js";
import activityRoutes from "./modules/crm/activities/activity.routes.js";
import contactRoutes from "./modules/crm/contacts/contact.routes.js";

import publicRoutes from "./modules/public/public.routes.js";
import careerRoutes from "./modules/careers/career.routes.js";
import slideRoutes from "./modules/homepage/slide.routes.js";

import procurementCategoryRoutes from "./modules/procurement/category.routes.js";
import procurementVendorRoutes from "./modules/procurement/vendor.routes.js";
import procurementRequestRoutes from "./modules/procurement/request.routes.js";
import vendorApplicationRoutes from "./modules/procurement/vendor-application.routes.js";
import rfqRoutes from "./modules/procurement/rfq.routes.js";

/* HR */
import expenseRoutes from "./modules/hr/expenses/expense.routes.js";
import staffRoutes from "./modules/hr/staff/staff.routes.js";
import leaveRoutes from "./modules/hr/leaves/leave.routes.js";
import scorecardTemplateRoutes from "./modules/hr/scorecard-templates/template.routes.js";

import permissionsRoutes from "./modules/iam/permissions/permissions.routes.js";

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again later",
});

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );

  app.use(requestLogger);
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, status: "up", env: env.nodeEnv })
  );

  app.use("/api/auth/login", loginRateLimiter);
  app.use("/api/auth", authRoutes);

  app.use("/api/users", iamUsersRoutes);
  app.use("/api/roles", rolesRoutes);
  app.use("/api/invites", invitesRoutes);
  app.use("/api/permissions", permissionsRoutes);

  app.use("/api/tickets", ticketRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/service", serviceTemplateRoutes);
  app.use("/api/enrollments", enrollmentsRoutes);
  app.use("/api/customers", customersRoutes);

  app.use("/api/media", mediaRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/productions", productionRoutes);
  app.use("/api/jobs", jobsRoutes);
  app.use("/api/teams", teamsRoutes);

  app.use("/api/billing", billingRoutes);
  app.use("/api/files", filesRoutes);
  app.use("/api", auditRoutes);

  app.use("/api/crm/deals", dealRoutes);
  app.use("/api/crm/leads", leadRoutes);
  app.use("/api/crm/accounts", accountsRoutes);
  app.use("/api/crm/activities", activityRoutes);
  app.use("/api/crm/contacts", contactRoutes);

  /* HR */
  app.use("/api/hr/expenses", expenseRoutes);
  app.use("/api/hr/staff", staffRoutes);
  app.use("/api/hr/leaves", leaveRoutes);
  app.use("/api/hr/scorecard-templates", scorecardTemplateRoutes);

  app.use("/api/public", publicRoutes);
  app.use("/api/careers", careerRoutes);
  app.use("/api/homepage/slides", slideRoutes);

  app.use("/api/procurement/categories", procurementCategoryRoutes);
  app.use("/api/procurement/vendors", procurementVendorRoutes);
  app.use("/api/procurement/requests", procurementRequestRoutes);
  app.use("/api/vendor-applications", vendorApplicationRoutes);
  app.use("/api/procurement/rfqs", rfqRoutes);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, message: "Route not found" });
  });

  app.use(errorHandler);

  return app;
}
