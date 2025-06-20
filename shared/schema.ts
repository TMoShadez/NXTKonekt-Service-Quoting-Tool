import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  partnerOrganization: text("partner_organization"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Service Type
  serviceType: varchar("service_type", { enum: ["site-assessment", "fleet-tracking", "fleet-camera"] }).default("site-assessment"),
  
  // Sales Executive Info
  salesExecutiveName: text("sales_executive_name").notNull(),
  salesExecutiveEmail: varchar("sales_executive_email").notNull(),
  salesExecutivePhone: varchar("sales_executive_phone"),
  
  // Customer Info
  customerCompanyName: text("customer_company_name").notNull(),
  customerContactName: text("customer_contact_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone"),
  siteAddress: text("site_address").notNull(),
  industry: varchar("industry"),
  preferredInstallationDate: timestamp("preferred_installation_date"),
  
  // Site Assessment
  buildingType: varchar("building_type"),
  coverageArea: integer("coverage_area"),
  floors: integer("floors"),
  deviceCount: integer("device_count"),
  powerAvailable: boolean("power_available").default(false),
  ethernetRequired: boolean("ethernet_required").default(false),
  ceilingMount: boolean("ceiling_mount").default(false),
  outdoorCoverage: boolean("outdoor_coverage").default(false),
  networkSignal: varchar("network_signal"),
  signalStrength: varchar("signal_strength"),
  connectionUsage: varchar("connection_usage"),
  routerLocation: varchar("router_location"),
  antennaCable: varchar("antenna_cable"),
  deviceConnectionAssistance: varchar("device_connection_assistance"),
  lowSignalAntennaCable: varchar("low_signal_antenna_cable"),
  antennaType: varchar("antenna_type"),
  antennaInstallationLocation: text("antenna_installation_location"),
  routerMounting: varchar("router_mounting"),
  dualWanSupport: varchar("dual_wan_support"),
  ceilingHeight: varchar("ceiling_height"),
  ceilingType: varchar("ceiling_type"),
  routerMake: varchar("router_make"),
  routerModel: varchar("router_model", { length: 20 }),
  cableFootage: varchar("cable_footage"),
  interferenceSources: text("interference_sources"),
  specialRequirements: text("special_requirements"),
  
  // Quote Info
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  additionalNotes: text("additional_notes"),
  
  status: varchar("status").default("draft"), // draft, completed, sent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  quoteNumber: varchar("quote_number").notNull().unique(),
  
  // Pricing breakdown
  surveyCost: decimal("survey_cost", { precision: 10, scale: 2 }),
  installationCost: decimal("installation_cost", { precision: 10, scale: 2 }),
  configurationCost: decimal("configuration_cost", { precision: 10, scale: 2 }),
  trainingCost: decimal("training_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  
  status: varchar("status").default("pending"), // pending, approved, rejected
  pdfUrl: text("pdf_url"),
  emailSent: boolean("email_sent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileType: varchar("file_type").notNull(), // photo, document
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizations),
  assessments: many(assessments),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  user: one(users, {
    fields: [organizations.userId],
    references: [users.id],
  }),
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [assessments.organizationId],
    references: [organizations.id],
  }),
  quotes: many(quotes),
  files: many(uploadedFiles),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  assessment: one(assessments, {
    fields: [quotes.assessmentId],
    references: [assessments.id],
  }),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  assessment: one(assessments, {
    fields: [uploadedFiles.assessmentId],
    references: [assessments.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
