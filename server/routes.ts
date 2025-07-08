import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { upload, saveFileToDatabase, deleteFileFromDisk } from "./services/fileUpload";
import { calculatePricing } from "./services/pricingEngine";
import { generateQuotePDF } from "./services/pdfGenerator";
import { hubspotService } from "./services/hubspotService";
import { insertAssessmentSchema, insertOrganizationSchema } from "@shared/schema";
import { emailService } from "./services/emailService";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { assessments, quotes, users, organizations } from "@shared/schema";
import { eq, ne, desc, or, isNull } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgData = insertOrganizationSchema.parse({ ...req.body, userId });
      
      const organization = await storage.createOrganization(orgData);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get('/api/organizations/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Assessment routes
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Clean the request body to handle organizationId and dates properly
      const cleanedBody = { ...req.body };
      if (cleanedBody.organizationId === 0 || cleanedBody.organizationId === null || cleanedBody.organizationId === undefined) {
        delete cleanedBody.organizationId;
      }
      
      // Convert date strings to Date objects
      if (cleanedBody.preferredInstallationDate && typeof cleanedBody.preferredInstallationDate === 'string') {
        cleanedBody.preferredInstallationDate = new Date(cleanedBody.preferredInstallationDate);
      }
      
      const assessmentData = insertAssessmentSchema.parse({ 
        ...cleanedBody, 
        userId,
        status: 'draft'
      });
      
      const assessment = await storage.createAssessment(assessmentData);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.put('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingAssessment = await storage.getAssessment(assessmentId);
      if (!existingAssessment || existingAssessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Clean the assessment data to handle organizationId and dates properly
      const cleanedData = { ...req.body };
      if (cleanedData.organizationId === 0 || cleanedData.organizationId === null) {
        delete cleanedData.organizationId;
      }
      
      // Convert date strings to Date objects
      if (cleanedData.preferredInstallationDate && typeof cleanedData.preferredInstallationDate === 'string') {
        cleanedData.preferredInstallationDate = new Date(cleanedData.preferredInstallationDate);
      }
      
      const assessmentData = insertAssessmentSchema.partial().parse(cleanedData);
      const updatedAssessment = await storage.updateAssessment(assessmentId, assessmentData);
      res.json(updatedAssessment);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.get('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getAssessmentsByUserId(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  // File upload routes
  app.post('/api/assessments/:id/files', isAuthenticated, upload.array('files', 10), async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const fileType = req.body.fileType as 'photo' | 'document';

      // Verify assessment ownership
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const files = req.files as Express.Multer.File[];
      const savedFiles = [];

      for (const file of files) {
        const savedFile = await saveFileToDatabase(assessmentId, file, fileType);
        savedFiles.push(savedFile);
      }

      res.json(savedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get('/api/assessments/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Verify assessment ownership
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const files = await storage.getFilesByAssessmentId(assessmentId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Get file details to verify ownership and delete from disk
      const files = await storage.getFilesByAssessmentId(0); // This needs to be fixed - we need a way to get file by id
      // For now, we'll trust the frontend to only send valid file IDs
      
      await storage.deleteFile(fileId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Quote routes
  app.post('/api/assessments/:id/quote', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Verify assessment ownership
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check if quote already exists
      let quote = await storage.getQuoteByAssessmentId(assessmentId);
      
      if (!quote) {
        // Calculate pricing
        const pricing = calculatePricing(assessment);
        
        // Generate quote number
        const quoteNumber = `Q-${new Date().getFullYear()}-${String(assessmentId).padStart(4, '0')}`;

        // Create quote
        quote = await storage.createQuote({
          assessmentId,
          quoteNumber,
          surveyCost: pricing.surveyCost.toString(),
          installationCost: pricing.installationCost.toString(),
          configurationCost: pricing.configurationCost.toString(),
          trainingCost: pricing.trainingCost.toString(),
          hardwareCost: pricing.hardwareCost.toString(),
          removalCost: pricing.removalCost ? pricing.removalCost.toString() : undefined,
          totalCost: pricing.totalCost.toString(),
          surveyHours: pricing.surveyHours.toString(),
          installationHours: pricing.installationHours.toString(),
          configurationHours: pricing.configurationHours.toString(),
          removalHours: pricing.removalHours ? pricing.removalHours.toString() : undefined,
          laborHoldHours: pricing.laborHoldHours.toString(),
          laborHoldCost: pricing.laborHoldCost.toString(),
          hourlyRate: pricing.hourlyRate.toString(),
          status: 'pending',
        });

        // Update assessment with total cost
        await storage.updateAssessment(assessmentId, {
          totalCost: pricing.totalCost.toString(),
          status: 'completed',
        });

        // Sync to HubSpot (async, don't block response)
        (async () => {
          try {
            console.log(`🔄 Starting automatic HubSpot sync for quote ${quote.quoteNumber}...`);
            const organization = await storage.getOrganizationByUserId(userId);
            if (organization) {
              await hubspotService.syncQuoteToHubSpot(quote, assessment, organization);
              console.log(`✅ Quote ${quote.quoteNumber} synced to HubSpot successfully`);
            } else {
              console.warn('⚠️ No organization found for user, skipping HubSpot sync');
            }
          } catch (hubspotError: any) {
            console.error(`❌ Failed to sync quote ${quote.quoteNumber} to HubSpot:`, hubspotError);
            console.error('HubSpot sync error details:', JSON.stringify(hubspotError, null, 2));
            // Don't fail the request if HubSpot sync fails
          }
        })();
      }

      res.json(quote);
    } catch (error) {
      console.error("Error generating quote:", error);
      res.status(500).json({ message: "Failed to generate quote" });
    }
  });

  app.post('/api/quotes/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Get quote with assessment
      const quotes = await storage.getQuotesByUserId(userId);
      const quoteWithAssessment = quotes.find(q => q.id === quoteId);

      if (!quoteWithAssessment) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Get organization name
      const organization = await storage.getOrganizationByUserId(userId);
      const organizationName = organization?.name || 'Unknown Organization';

      // Generate PDF
      const pdfPath = await generateQuotePDF({
        assessment: quoteWithAssessment.assessment,
        quote: quoteWithAssessment,
        organizationName,
      });

      // Update quote with PDF URL
      const relativePath = path.relative(process.cwd(), pdfPath);
      await storage.updateQuote(quoteId, {
        pdfUrl: relativePath,
      });

      res.json({ pdfUrl: `/api/files/pdf/${path.basename(pdfPath)}` });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quotes = await storage.getQuotesByUserId(userId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.delete('/api/quotes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Verify quote ownership by getting user's quotes and checking if this quote exists
      const userQuotes = await storage.getQuotesByUserId(userId);
      const quoteExists = userQuotes.find(q => q.id === quoteId);

      if (!quoteExists) {
        return res.status(404).json({ message: "Quote not found or access denied" });
      }

      await storage.deleteQuote(quoteId);
      res.json({ success: true, message: "Quote deleted successfully" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Customer portal routes (public - no authentication required)
  app.get('/api/customer/quote/:token', async (req, res) => {
    try {
      const token = req.params.token;
      
      // In a real implementation, you'd decode/verify the token
      // For this mockup, we'll use the quote ID as the token
      const quoteId = parseInt(token);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({ message: "Invalid quote ID" });
      }
      
      const quote = await storage.getQuote(quoteId);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Get organization info
      const organization = await storage.getOrganizationByUserId(quote.assessment.userId);
      
      const response = {
        ...quote,
        organization: organization || { name: "NXTKonekt" }
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching customer quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post('/api/customer/quote/:token/:action', async (req, res) => {
    try {
      const token = req.params.token;
      const action = req.params.action;
      const { feedback } = req.body;
      
      // Validate action
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      // In a real implementation, you'd decode/verify the token
      const quoteId = parseInt(token);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({ message: "Invalid quote ID" });
      }
      
      const quote = await storage.getQuote(quoteId);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Update quote status
      const updatedQuote = await storage.updateQuote(quote.id, {
        status: action === 'approve' ? 'approved' : 'rejected',
        // In a real implementation, you'd store customer feedback in a separate field
      });

      // Update HubSpot deal status (async, don't block response)
      (async () => {
        try {
          await hubspotService.updateDealStatus(quote.id, action as 'approved' | 'rejected');
          console.log(`HubSpot deal status updated for quote ${quote.quoteNumber}`);
        } catch (hubspotError) {
          console.error(`Failed to update HubSpot deal status for quote ${quote.quoteNumber}:`, hubspotError);
          // Don't fail the request if HubSpot sync fails
        }
      })();

      res.json({ 
        success: true, 
        message: `Quote ${action}d successfully`,
        quote: updatedQuote 
      });
    } catch (error) {
      console.error("Error updating quote status:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  // File serving routes
  app.get('/api/files/pdf/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'pdfs', filename);
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  app.get('/api/files/photo/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'photos', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // HubSpot integration routes
  app.get('/api/hubspot/test', isAuthenticated, async (req, res) => {
    try {
      console.log('🧪 Starting HubSpot connection test from dashboard...');
      const isConnected = await hubspotService.testConnection();
      console.log('🧪 HubSpot test result:', isConnected);
      
      res.json({ 
        connected: isConnected,
        message: isConnected ? 'HubSpot connection successful' : 'HubSpot connection failed'
      });
    } catch (error: any) {
      console.error("❌ HubSpot test failed with exception:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      res.status(500).json({ 
        connected: false, 
        message: "HubSpot test failed",
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error.toString()
      });
    }
  });

  // Test HubSpot on server startup
  (async () => {
    try {
      console.log('🧪 Testing HubSpot connection on server startup...');
      const testResult = await hubspotService.testConnection();
      console.log('🧪 Server startup HubSpot test:', testResult ? 'PASSED' : 'FAILED');
    } catch (error) {
      console.error('🧪 Server startup HubSpot test failed:', error);
    }
  })();

  app.post('/api/hubspot/sync-quote/:id', isAuthenticated, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const quote = await storage.getQuote(quoteId);
      if (!quote || quote.assessment.userId !== userId) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const organization = await storage.getOrganizationByUserId(userId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const result = await hubspotService.syncQuoteToHubSpot(quote, quote.assessment, organization);
      
      res.json({
        success: true,
        message: `Quote ${quote.quoteNumber} synced to HubSpot successfully`,
        hubspotData: {
          contactId: result.contact.id,
          dealId: result.deal.id,
          ticketId: result.ticket.id
        }
      });
    } catch (error) {
      console.error("Manual HubSpot sync failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to sync to HubSpot",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin Routes
  const isAdmin: RequestHandler = async (req: any, res, next) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || (!user.isSystemAdmin && user.role !== 'admin')) {
      return res.status(403).json({ message: "System admin access required" });
    }
    
    next();
  };

  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/partners', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const partnersWithOrgs = await Promise.all(
        users.map(async (user) => {
          const organization = await storage.getOrganizationByUserId(user.id);
          return { ...user, organization };
        })
      );
      res.json(partnersWithOrgs);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get('/api/admin/assessments', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all assessments with user and organization information
      const allAssessments = await db.select({
        id: assessments.id,
        userId: assessments.userId,
        organizationId: assessments.organizationId,
        serviceType: assessments.serviceType,
        customerContactName: assessments.customerContactName,
        customerCompanyName: assessments.customerCompanyName,
        customerEmail: assessments.customerEmail,
        customerPhone: assessments.customerPhone,
        createdAt: assessments.createdAt,
        updatedAt: assessments.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        organizationName: organizations.name,
      })
      .from(assessments)
      .leftJoin(users, eq(assessments.userId, users.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .where(or(eq(users.isSystemAdmin, false), isNull(users.isSystemAdmin))) // Include non-system admin users
      .orderBy(desc(assessments.createdAt));
      
      res.json(allAssessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/admin/quotes', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all quotes with assessment, user, and organization information
      const allQuotes = await db.select({
        id: quotes.id,
        assessmentId: quotes.assessmentId,
        quoteNumber: quotes.quoteNumber,
        totalCost: quotes.totalCost,
        status: quotes.status,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        assessmentServiceType: assessments.serviceType,
        customerContactName: assessments.customerContactName,
        customerCompanyName: assessments.customerCompanyName,
        customerEmail: assessments.customerEmail,
        customerPhone: assessments.customerPhone,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        organizationName: organizations.name,
      })
      .from(quotes)
      .leftJoin(assessments, eq(quotes.assessmentId, assessments.id))
      .leftJoin(users, eq(assessments.userId, users.id))
      .leftJoin(organizations, eq(assessments.organizationId, organizations.id))
      .where(or(eq(users.isSystemAdmin, false), isNull(users.isSystemAdmin))) // Include non-system admin users
      .orderBy(desc(quotes.createdAt));
      
      res.json(allQuotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.patch('/api/admin/partners/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      console.log("🔄 Partner status update request:", { id, status, body: req.body });
      
      if (!status || !['pending', 'approved', 'suspended'].includes(status)) {
        console.log("❌ Invalid status provided:", status);
        return res.status(400).json({ message: "Invalid status" });
      }

      const orgId = parseInt(id);
      if (isNaN(orgId)) {
        console.log("❌ Invalid organization ID:", id);
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      console.log("🔄 Updating organization ID:", orgId, "to status:", status);
      const organization = await storage.updateOrganizationStatus(orgId, status);
      
      if (!organization) {
        console.log("❌ Organization not found for ID:", orgId);
        return res.status(404).json({ message: "Organization not found" });
      }

      console.log("✅ Organization updated successfully:", organization);
      res.json(organization);
    } catch (error) {
      console.error("❌ Error updating partner status:", error);
      res.status(500).json({ message: "Failed to update partner status" });
    }
  });

  app.patch('/api/admin/users/:id/toggle', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await storage.toggleUserActive(id, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Email invitation routes
  app.post('/api/admin/send-invitation', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { email, recipientName, companyName } = req.body;
      const adminUserId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminUserId);
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate invitation token
      const invitationToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation record
      const invitation = await storage.createPartnerInvitation({
        email,
        invitedBy: adminUserId,
        invitedByName: `${adminUser?.firstName || ''} ${adminUser?.lastName || ''}`.trim() || adminUser?.email || 'Admin',
        invitationToken,
        expiresAt,
      });

      // Generate signup link with tracking
      const signupLink = `${req.protocol}://${req.get('host')}/api/login?invitation=${invitationToken}`;

      // Send email invitation
      const emailResult = await emailService.sendPartnerInvitation({
        recipientEmail: email,
        recipientName,
        senderName: invitation.invitedByName,
        signupLink,
        companyName,
      });

      if (emailResult.success) {
        // Track invitation sent
        await storage.trackSignupEvent({
          event: 'invitation_sent',
          email,
          invitationId: invitation.id,
          metadata: { messageId: emailResult.messageId },
        });

        res.json({ 
          success: true, 
          invitation,
          message: 'Invitation sent successfully'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: emailResult.error,
          message: 'Failed to send invitation email'
        });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Get partner invitations
  app.get('/api/admin/invitations', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const invitations = await storage.getPartnerInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Get signup analytics
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getSignupAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Test email connection
  app.get('/api/admin/test-email', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const testResult = await emailService.testConnection();
      res.json(testResult);
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({ message: "Failed to test email connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
