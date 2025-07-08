import {
  users,
  organizations,
  assessments,
  quotes,
  uploadedFiles,
  partnerInvitations,
  signupAnalytics,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Assessment,
  type InsertAssessment,
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
import { eq, desc, and, sql } from "drizzle-orm";

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
  
  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByUserId(userId: string): Promise<Assessment[]>;
  getAllAssessments(): Promise<(Assessment & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]>;
  
  // Quote operations
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  getQuote(id: number): Promise<(Quote & { assessment: Assessment }) | undefined>;
  getQuotesByUserId(userId: string): Promise<(Quote & { assessment: Assessment })[]>;
  getQuoteByAssessmentId(assessmentId: number): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<void>;
  getAllQuotes(): Promise<(Quote & { assessment: Assessment; user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]>;
  
  // File operations
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getFilesByAssessmentId(assessmentId: number): Promise<UploadedFile[]>;
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
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Ensure new users get 'partner' role by default, not admin
    const userDataWithRole = {
      ...userData,
      role: userData.role || 'partner', // Default to partner role for new signups
    };
    
    const [user] = await db
      .insert(users)
      .values(userDataWithRole)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          // Only update profile info, preserve existing role
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin operations
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
    const [userCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(users);
    const [pendingCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(organizations)
      .where(eq(organizations.partnerStatus, 'pending'));
    const [assessmentCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(assessments);
    const [quoteCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(quotes);
    
    // Calculate monthly revenue from approved quotes
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const [revenueResult] = await db
      .select({ 
        total: sql<number>`cast(coalesce(sum(cast(total_cost as decimal)), 0) as decimal)` 
      })
      .from(quotes)
      .where(
        and(
          eq(quotes.status, 'approved'),
          sql`${quotes.createdAt} >= ${currentMonth.toISOString()}`
        )
      );

    return {
      totalPartners: userCount?.count || 0,
      pendingPartners: pendingCount?.count || 0,
      totalAssessments: assessmentCount?.count || 0,
      totalQuotes: quoteCount?.count || 0,
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
    console.log("💾 Database update: org ID", id, "to status", status);
    
    const [organization] = await db
      .update(organizations)
      .set({ partnerStatus: status, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
      
    console.log("💾 Database result:", organization);
    return organization;
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set({ ...assessment, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id));
    return assessment;
  }

  async getAssessmentsByUserId(userId: string): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }

  async getAllAssessments(): Promise<(Assessment & { user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]> {
    const result = await db
      .select({
        // Assessment fields
        id: assessments.id,
        userId: assessments.userId,
        organizationId: assessments.organizationId,
        serviceType: assessments.serviceType,
        status: assessments.status,
        customerName: assessments.customerName,
        customerEmail: assessments.customerEmail,
        customerPhone: assessments.customerPhone,
        customerCompany: assessments.customerCompany,
        siteAddress: assessments.siteAddress,
        preferredInstallationDate: assessments.preferredInstallationDate,
        createdAt: assessments.createdAt,
        updatedAt: assessments.updatedAt,
        // User info
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        // Organization info
        organizationName: organizations.name,
      })
      .from(assessments)
      .leftJoin(users, eq(assessments.userId, users.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .orderBy(desc(assessments.createdAt));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      organizationId: row.organizationId,
      serviceType: row.serviceType,
      status: row.status,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      customerCompany: row.customerCompany,
      siteAddress: row.siteAddress,
      preferredInstallationDate: row.preferredInstallationDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        email: row.userEmail!,
        firstName: row.userFirstName || undefined,
        lastName: row.userLastName || undefined,
      },
      organization: row.organizationName ? { name: row.organizationName } : undefined,
    }));
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

  async getQuote(id: number): Promise<(Quote & { assessment: Assessment }) | undefined> {
    const [result] = await db
      .select({
        id: quotes.id,
        assessmentId: quotes.assessmentId,
        quoteNumber: quotes.quoteNumber,
        surveyCost: quotes.surveyCost,
        installationCost: quotes.installationCost,
        configurationCost: quotes.configurationCost,
        trainingCost: quotes.trainingCost,
        hardwareCost: quotes.hardwareCost,
        removalCost: quotes.removalCost,
        totalCost: quotes.totalCost,
        surveyHours: quotes.surveyHours,
        installationHours: quotes.installationHours,
        configurationHours: quotes.configurationHours,
        removalHours: quotes.removalHours,
        laborHoldHours: quotes.laborHoldHours,
        laborHoldCost: quotes.laborHoldCost,
        hourlyRate: quotes.hourlyRate,
        status: quotes.status,
        pdfUrl: quotes.pdfUrl,
        emailSent: quotes.emailSent,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        assessment: assessments,
      })
      .from(quotes)
      .innerJoin(assessments, eq(quotes.assessmentId, assessments.id))
      .where(eq(quotes.id, id));
    return result;
  }

  async getQuotesByUserId(userId: string): Promise<(Quote & { assessment: Assessment })[]> {
    return await db
      .select({
        id: quotes.id,
        assessmentId: quotes.assessmentId,
        quoteNumber: quotes.quoteNumber,
        surveyCost: quotes.surveyCost,
        installationCost: quotes.installationCost,
        configurationCost: quotes.configurationCost,
        trainingCost: quotes.trainingCost,
        hardwareCost: quotes.hardwareCost,
        removalCost: quotes.removalCost,
        totalCost: quotes.totalCost,
        surveyHours: quotes.surveyHours,
        installationHours: quotes.installationHours,
        configurationHours: quotes.configurationHours,
        removalHours: quotes.removalHours,
        laborHoldHours: quotes.laborHoldHours,
        laborHoldCost: quotes.laborHoldCost,
        hourlyRate: quotes.hourlyRate,
        status: quotes.status,
        pdfUrl: quotes.pdfUrl,
        emailSent: quotes.emailSent,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        assessment: assessments,
      })
      .from(quotes)
      .innerJoin(assessments, eq(quotes.assessmentId, assessments.id))
      .where(eq(assessments.userId, userId))
      .orderBy(desc(quotes.createdAt));
  }

  async getQuoteByAssessmentId(assessmentId: number): Promise<Quote | undefined> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.assessmentId, assessmentId));
    return quote;
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
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.assessmentId, assessmentId))
      .orderBy(desc(uploadedFiles.createdAt));
  }

  async deleteFile(id: number): Promise<void> {
    await db
      .delete(uploadedFiles)
      .where(eq(uploadedFiles.id, id));
  }

  async deleteQuote(id: number): Promise<void> {
    await db
      .delete(quotes)
      .where(eq(quotes.id, id));
  }

  async getAllQuotes(): Promise<(Quote & { assessment: Assessment; user: { email: string; firstName?: string; lastName?: string }; organization?: { name: string } })[]> {
    const result = await db
      .select({
        // Quote fields
        id: quotes.id,
        assessmentId: quotes.assessmentId,
        quoteNumber: quotes.quoteNumber,
        surveyCost: quotes.surveyCost,
        installationCost: quotes.installationCost,
        configurationCost: quotes.configurationCost,
        trainingCost: quotes.trainingCost,
        hardwareCost: quotes.hardwareCost,
        removalCost: quotes.removalCost,
        totalCost: quotes.totalCost,
        surveyHours: quotes.surveyHours,
        installationHours: quotes.installationHours,
        configurationHours: quotes.configurationHours,
        removalHours: quotes.removalHours,
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
        // Assessment fields
        assessmentServiceType: assessments.serviceType,
        assessmentCustomerName: assessments.customerName,
        assessmentCustomerEmail: assessments.customerEmail,
        assessmentCustomerCompany: assessments.customerCompany,
        assessmentSiteAddress: assessments.siteAddress,
        assessmentUserId: assessments.userId,
        // User info
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        // Organization info
        organizationName: organizations.name,
      })
      .from(quotes)
      .leftJoin(assessments, eq(quotes.assessmentId, assessments.id))
      .leftJoin(users, eq(assessments.userId, users.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .orderBy(desc(quotes.createdAt));

    return result.map(row => ({
      id: row.id,
      assessmentId: row.assessmentId,
      quoteNumber: row.quoteNumber,
      surveyCost: row.surveyCost,
      installationCost: row.installationCost,
      configurationCost: row.configurationCost,
      trainingCost: row.trainingCost,
      hardwareCost: row.hardwareCost,
      removalCost: row.removalCost,
      totalCost: row.totalCost,
      surveyHours: row.surveyHours,
      installationHours: row.installationHours,
      configurationHours: row.configurationHours,
      removalHours: row.removalHours,
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
      assessment: {
        id: row.assessmentId,
        userId: row.assessmentUserId!,
        organizationId: null,
        serviceType: row.assessmentServiceType!,
        status: 'completed',
        customerName: row.assessmentCustomerName,
        customerEmail: row.assessmentCustomerEmail,
        customerPhone: null,
        customerCompany: row.assessmentCustomerCompany,
        siteAddress: row.assessmentSiteAddress,
        preferredInstallationDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: {
        email: row.userEmail!,
        firstName: row.userFirstName || undefined,
        lastName: row.userLastName || undefined,
      },
      organization: row.organizationName ? { name: row.organizationName } : undefined,
    }));
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
    const [created] = await db
      .insert(signupAnalytics)
      .values(analytics)
      .returning();
    return created;
  }

  async getSignupAnalytics(startDate?: Date, endDate?: Date): Promise<SignupAnalytics[]> {
    let query = db.select().from(signupAnalytics);
    
    if (startDate && endDate) {
      query = query.where(
        and(
          sql`${signupAnalytics.timestamp} >= ${startDate.toISOString()}`,
          sql`${signupAnalytics.timestamp} <= ${endDate.toISOString()}`
        )
      );
    }
    
    return await query.orderBy(desc(signupAnalytics.timestamp));
  }
}

export const storage = new DatabaseStorage();
