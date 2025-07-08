import {
  users,
  organizations,
  quotes,
  uploadedFiles,
  partnerInvitations,
  signupAnalytics,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Quote,
  type InsertQuote,
  type UploadedFile,
  type InsertUploadedFile,
  type PartnerInvitation,
  type InsertPartnerInvitation,
  type SignupAnalytics,
  type InsertSignupAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  toggleUserActive(id: string, isActive: boolean): Promise<User>;
  getAdminStats(): Promise<{
    totalPartners: number;
    pendingPartners: number;
    totalAssessments: number;
    totalQuotes: number;
    monthlyRevenue: number;
  }>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganizationByUserId(userId: string): Promise<Organization | undefined>;
  updateOrganizationStatus(id: number, status: string): Promise<Organization>;
  
  // Quote operations (replaces assessment operations)
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  getQuote(id: number): Promise<Quote | undefined>;
  getQuotesByUserId(userId: string): Promise<Quote[]>;
  deleteQuote(id: number): Promise<void>;
  getAllQuotes(): Promise<(Quote & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]>;
  
  // Legacy assessment methods for compatibility
  createAssessment(assessment: InsertQuote): Promise<Quote>;
  updateAssessment(id: number, assessment: Partial<InsertQuote>): Promise<Quote>;
  getAssessment(id: number): Promise<Quote | undefined>;
  getAssessmentsByUserId(userId: string): Promise<Quote[]>;
  getAllAssessments(): Promise<(Quote & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]>;
  getQuoteByAssessmentId(assessmentId: number): Promise<Quote | undefined>;
  
  // File operations
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getFilesByAssessmentId(assessmentId: number): Promise<UploadedFile[]>;
  getFilesByQuoteId(quoteId: number): Promise<UploadedFile[]>;
  deleteFile(id: number): Promise<void>;
  
  // Partner invitation operations
  createPartnerInvitation(invitation: InsertPartnerInvitation): Promise<PartnerInvitation>;
  getPartnerInvitation(token: string): Promise<PartnerInvitation | undefined>;
  updatePartnerInvitationStatus(id: number, status: string, acceptedAt?: Date): Promise<PartnerInvitation>;
  getPartnerInvitations(): Promise<PartnerInvitation[]>;
  
  // Analytics operations
  trackSignupEvent(analytics: InsertSignupAnalytics): Promise<SignupAnalytics>;
  getSignupAnalytics(startDate?: Date, endDate?: Date): Promise<SignupAnalytics[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleUserActive(id: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAdminStats(): Promise<{
    totalPartners: number;
    pendingPartners: number;
    totalAssessments: number;
    totalQuotes: number;
    monthlyRevenue: number;
  }> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [partnersResult] = await db
      .select({ count: count() })
      .from(organizations);

    const [pendingResult] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.status, 'pending'));

    const [quotesResult] = await db
      .select({ count: count() })
      .from(quotes);

    const [revenueResult] = await db
      .select({ total: sum(quotes.totalCost) })
      .from(quotes)
      .where(and(
        eq(quotes.status, 'approved'),
        // Filter for current month if needed
      ));

    return {
      totalPartners: partnersResult?.count || 0,
      pendingPartners: pendingResult?.count || 0,
      totalAssessments: quotesResult?.count || 0, // Legacy compatibility
      totalQuotes: quotesResult?.count || 0,
      monthlyRevenue: Number(revenueResult?.total || 0),
    };
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(org)
      .returning();
    return organization;
  }

  async getOrganizationByUserId(userId: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, userId));
    return organization;
  }

  async updateOrganizationStatus(id: number, status: string): Promise<Organization> {
    const [organization] = await db
      .update(organizations)
      .set({ status })
      .where(eq(organizations.id, id))
      .returning();
    return organization;
  }

  // Quote operations
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values(quote)
      .returning();
    return newQuote;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id));
    return quote;
  }

  async getQuotesByUserId(userId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, userId))
      .orderBy(desc(quotes.createdAt));
  }

  async deleteQuote(id: number): Promise<void> {
    await db
      .delete(quotes)
      .where(eq(quotes.id, id));
  }

  async getAllQuotes(): Promise<(Quote & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]> {
    const result = await db
      .select({
        // Quote fields
        id: quotes.id,
        userId: quotes.userId,
        organizationId: quotes.organizationId,
        quoteNumber: quotes.quoteNumber,
        serviceType: quotes.serviceType,
        salesExecutiveName: quotes.salesExecutiveName,
        salesExecutiveEmail: quotes.salesExecutiveEmail,
        salesExecutivePhone: quotes.salesExecutivePhone,
        customerCompanyName: quotes.customerCompanyName,
        customerContactName: quotes.customerContactName,
        customerName: quotes.customerName,
        customerEmail: quotes.customerEmail,
        customerPhone: quotes.customerPhone,
        customerCompany: quotes.customerCompany,
        siteAddress: quotes.siteAddress,
        industry: quotes.industry,
        preferredInstallationDate: quotes.preferredInstallationDate,
        surveyCost: quotes.surveyCost,
        installationCost: quotes.installationCost,
        configurationCost: quotes.configurationCost,
        trainingCost: quotes.trainingCost,
        hardwareCost: quotes.hardwareCost,
        totalCost: quotes.totalCost,
        surveyHours: quotes.surveyHours,
        installationHours: quotes.installationHours,
        configurationHours: quotes.configurationHours,
        removalHours: quotes.removalHours,
        removalCost: quotes.removalCost,
        laborHoldHours: quotes.laborHoldHours,
        laborHoldCost: quotes.laborHoldCost,
        hourlyRate: quotes.hourlyRate,
        status: quotes.status,
        customerShareUrl: quotes.customerShareUrl,
        expiresAt: quotes.expiresAt,
        acceptedAt: quotes.acceptedAt,
        rejectedAt: quotes.rejectedAt,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        // User info
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        // Organization info
        organizationName: organizations.name,
      })
      .from(quotes)
      .leftJoin(users, eq(quotes.userId, users.id))
      .leftJoin(organizations, eq(quotes.organizationId, organizations.id))
      .orderBy(desc(quotes.createdAt));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      organizationId: row.organizationId,
      quoteNumber: row.quoteNumber,
      serviceType: row.serviceType,
      salesExecutiveName: row.salesExecutiveName,
      salesExecutiveEmail: row.salesExecutiveEmail,
      salesExecutivePhone: row.salesExecutivePhone,
      customerCompanyName: row.customerCompanyName,
      customerContactName: row.customerContactName,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      customerCompany: row.customerCompany,
      siteAddress: row.siteAddress,
      industry: row.industry,
      preferredInstallationDate: row.preferredInstallationDate,
      surveyCost: row.surveyCost,
      installationCost: row.installationCost,
      configurationCost: row.configurationCost,
      trainingCost: row.trainingCost,
      hardwareCost: row.hardwareCost,
      totalCost: row.totalCost,
      surveyHours: row.surveyHours,
      installationHours: row.installationHours,
      configurationHours: row.configurationHours,
      removalHours: row.removalHours,
      removalCost: row.removalCost,
      laborHoldHours: row.laborHoldHours,
      laborHoldCost: row.laborHoldCost,
      hourlyRate: row.hourlyRate,
      status: row.status,
      customerShareUrl: row.customerShareUrl,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      rejectedAt: row.rejectedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        email: row.userEmail!,
        firstName: row.userFirstName || undefined,
        lastName: row.userLastName || undefined,
      },
      organization: row.organizationName ? { name: row.organizationName } : undefined,
    } as Quote & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } }));
  }

  // Legacy assessment methods (for compatibility - all point to quotes)
  async createAssessment(assessment: InsertQuote): Promise<Quote> {
    return this.createQuote(assessment);
  }

  async updateAssessment(id: number, assessment: Partial<InsertQuote>): Promise<Quote> {
    return this.updateQuote(id, assessment);
  }

  async getAssessment(id: number): Promise<Quote | undefined> {
    return this.getQuote(id);
  }

  async getAssessmentsByUserId(userId: string): Promise<Quote[]> {
    return this.getQuotesByUserId(userId);
  }

  async getAllAssessments(): Promise<(Quote & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]> {
    return this.getAllQuotes();
  }

  async getQuoteByAssessmentId(assessmentId: number): Promise<Quote | undefined> {
    // Since assessments are now quotes, this just returns the quote itself
    return this.getQuote(assessmentId);
  }

  // File operations
  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
    const [newFile] = await db
      .insert(uploadedFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getFilesByAssessmentId(assessmentId: number): Promise<UploadedFile[]> {
    // Legacy method - now gets files by quote ID
    return this.getFilesByQuoteId(assessmentId);
  }

  async getFilesByQuoteId(quoteId: number): Promise<UploadedFile[]> {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.quoteId, quoteId))
      .orderBy(desc(uploadedFiles.createdAt));
  }

  async deleteFile(id: number): Promise<void> {
    await db
      .delete(uploadedFiles)
      .where(eq(uploadedFiles.id, id));
  }

  // Partner invitation operations
  async createPartnerInvitation(invitation: InsertPartnerInvitation): Promise<PartnerInvitation> {
    const [created] = await db
      .insert(partnerInvitations)
      .values(invitation)
      .returning();
    return created;
  }

  async getPartnerInvitation(token: string): Promise<PartnerInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(partnerInvitations)
      .where(eq(partnerInvitations.invitationToken, token));
    return invitation;
  }

  async updatePartnerInvitationStatus(id: number, status: string, acceptedAt?: Date): Promise<PartnerInvitation> {
    const [updated] = await db
      .update(partnerInvitations)
      .set({ status, acceptedAt })
      .where(eq(partnerInvitations.id, id))
      .returning();
    return updated;
  }

  async getPartnerInvitations(): Promise<PartnerInvitation[]> {
    return await db
      .select()
      .from(partnerInvitations)
      .orderBy(desc(partnerInvitations.createdAt));
  }

  // Analytics operations
  async trackSignupEvent(analytics: InsertSignupAnalytics): Promise<SignupAnalytics> {
    const [event] = await db
      .insert(signupAnalytics)
      .values(analytics)
      .returning();
    return event;
  }

  async getSignupAnalytics(startDate?: Date, endDate?: Date): Promise<SignupAnalytics[]> {
    let query = db.select().from(signupAnalytics);
    
    if (startDate && endDate) {
      query = query.where(and(
        // Add date filtering if needed
      ));
    }
    
    return await query.orderBy(desc(signupAnalytics.timestamp));
  }
}

export const storage = new DatabaseStorage();