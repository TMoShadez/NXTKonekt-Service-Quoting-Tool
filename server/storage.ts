import {
  users,
  organizations,
  assessments,
  quotes,
  uploadedFiles,
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
  
  // Quote operations
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  getQuote(id: number): Promise<(Quote & { assessment: Assessment }) | undefined>;
  getQuotesByUserId(userId: string): Promise<(Quote & { assessment: Assessment })[]>;
  getQuoteByAssessmentId(assessmentId: number): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<void>;
  
  // File operations
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getFilesByAssessmentId(assessmentId: number): Promise<UploadedFile[]>;
  deleteFile(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

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
}

export const storage = new DatabaseStorage();
