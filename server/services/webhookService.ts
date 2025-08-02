import crypto from 'crypto';
import type { Request } from 'express';
import { storage } from '../storage';
import { hubspotService } from './hubspotService';

export interface HubSpotWebhookPayload {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  changeSource: string;
  changeFlag: string;
  propertyName?: string;
  propertyValue?: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  objectType: string;
  objectId: string;
  portalId: string;
  occurredAt: Date;
  data: any;
  processed: boolean;
  createdAt: Date;
}

export class WebhookService {
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      console.warn('⚠️ HUBSPOT_WEBHOOK_SECRET not set - webhook verification disabled');
    }
  }

  /**
   * Verify HubSpot webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('⚠️ Webhook verification skipped - no secret configured');
      return true; // Allow webhooks when no secret is configured
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      );
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process contact webhook events
   */
  async processContactWebhook(payload: HubSpotWebhookPayload[]): Promise<void> {
    console.log(`📧 Processing ${payload.length} contact webhook events`);

    for (const event of payload) {
      try {
        console.log(`Processing contact event: ${event.subscriptionType} for contact ${event.objectId}`);
        
        switch (event.subscriptionType) {
          case 'contact.creation':
            await this.handleContactCreated(event);
            break;
          case 'contact.propertyChange':
            await this.handleContactUpdated(event);
            break;
          case 'contact.deletion':
            await this.handleContactDeleted(event);
            break;
          default:
            console.log(`🔄 Unhandled contact event type: ${event.subscriptionType}`);
        }
      } catch (error) {
        console.error(`❌ Error processing contact webhook event ${event.eventId}:`, error);
      }
    }
  }

  /**
   * Process deal webhook events
   */
  async processDealWebhook(payload: HubSpotWebhookPayload[]): Promise<void> {
    console.log(`💼 Processing ${payload.length} deal webhook events`);

    for (const event of payload) {
      try {
        console.log(`Processing deal event: ${event.subscriptionType} for deal ${event.objectId}`);
        
        switch (event.subscriptionType) {
          case 'deal.creation':
            await this.handleDealCreated(event);
            break;
          case 'deal.propertyChange':
            await this.handleDealUpdated(event);
            break;
          case 'deal.deletion':
            await this.handleDealDeleted(event);
            break;
          default:
            console.log(`🔄 Unhandled deal event type: ${event.subscriptionType}`);
        }
      } catch (error) {
        console.error(`❌ Error processing deal webhook event ${event.eventId}:`, error);
      }
    }
  }

  /**
   * Process ticket webhook events
   */
  async processTicketWebhook(payload: HubSpotWebhookPayload[]): Promise<void> {
    console.log(`🎫 Processing ${payload.length} ticket webhook events`);

    for (const event of payload) {
      try {
        console.log(`Processing ticket event: ${event.subscriptionType} for ticket ${event.objectId}`);
        
        switch (event.subscriptionType) {
          case 'ticket.creation':
            await this.handleTicketCreated(event);
            break;
          case 'ticket.propertyChange':
            await this.handleTicketUpdated(event);
            break;
          case 'ticket.deletion':
            await this.handleTicketDeleted(event);
            break;
          default:
            console.log(`🔄 Unhandled ticket event type: ${event.subscriptionType}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ticket webhook event ${event.eventId}:`, error);
      }
    }
  }

  private async handleContactCreated(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`👤 New contact created in HubSpot: ${event.objectId}`);
    
    try {
      // Fetch full contact details from HubSpot
      const contact = await hubspotService.getContact(event.objectId.toString());
      
      // Check if we have any assessments for this email
      const assessments = await storage.getAssessmentsByEmail(contact.email);
      
      if (assessments.length > 0) {
        console.log(`🔗 Found ${assessments.length} assessments for contact ${contact.email}`);
        
        // Update assessments with HubSpot contact ID
        for (const assessment of assessments) {
          await storage.updateAssessment(assessment.id, {
            hubspotContactId: contact.id
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error handling contact creation webhook:`, error);
    }
  }

  private async handleContactUpdated(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`👤 Contact updated in HubSpot: ${event.objectId}, property: ${event.propertyName}`);
    
    // Handle specific property changes that might affect our assessments
    if (event.propertyName === 'email' || event.propertyName === 'lifecyclestage') {
      try {
        const contact = await hubspotService.getContact(event.objectId.toString());
        
        // Update any related assessments
        const assessments = await storage.getAssessmentsByHubSpotContactId(contact.id);
        
        for (const assessment of assessments) {
          if (event.propertyName === 'email' && assessment.customerEmail !== contact.email) {
            await storage.updateAssessment(assessment.id, {
              customerEmail: contact.email
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error handling contact update webhook:`, error);
      }
    }
  }

  private async handleContactDeleted(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`👤 Contact deleted in HubSpot: ${event.objectId}`);
    
    try {
      // Find assessments linked to this contact and clear the HubSpot reference
      const assessments = await storage.getAssessmentsByHubSpotContactId(event.objectId.toString());
      
      for (const assessment of assessments) {
        await storage.updateAssessment(assessment.id, {
          hubspotContactId: null
        });
      }
    } catch (error) {
      console.error(`❌ Error handling contact deletion webhook:`, error);
    }
  }

  private async handleDealCreated(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`💼 New deal created in HubSpot: ${event.objectId}`);
    
    try {
      const deal = await hubspotService.getDeal(event.objectId.toString());
      
      // Check if this deal is related to any of our quotes based on deal name or custom properties
      const quotes = await storage.getAllQuotes();
      const relatedQuote = quotes.find(q => 
        deal.dealname.includes(q.quoteNumber) || 
        deal.dealname.includes(`Assessment ${q.assessmentId}`)
      );
      
      if (relatedQuote) {
        console.log(`🔗 Found related quote: ${relatedQuote.quoteNumber}`);
        
        // Update quote with HubSpot deal ID
        await storage.updateQuote(relatedQuote.id, {
          hubspotDealId: deal.id,
          status: 'in_progress'
        });
      }
    } catch (error) {
      console.error(`❌ Error handling deal creation webhook:`, error);
    }
  }

  private async handleDealUpdated(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`💼 Deal updated in HubSpot: ${event.objectId}, property: ${event.propertyName}`);
    
    // Handle deal stage changes
    if (event.propertyName === 'dealstage') {
      try {
        const deal = await hubspotService.getDeal(event.objectId.toString());
        const quotes = await storage.getQuotesByHubSpotDealId(event.objectId.toString());
        
        for (const quote of quotes) {
          let newStatus = quote.status;
          
          // Map HubSpot deal stages to our quote statuses
          switch (deal.dealstage) {
            case 'closedwon':
              newStatus = 'approved';
              break;
            case 'closedlost':
              newStatus = 'rejected';
              break;
            case 'contractsent':
              newStatus = 'sent';
              break;
            default:
              newStatus = 'in_progress';
          }
          
          if (newStatus !== quote.status) {
            await storage.updateQuote(quote.id, { status: newStatus });
            console.log(`🔄 Updated quote ${quote.quoteNumber} status to ${newStatus}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error handling deal update webhook:`, error);
      }
    }
  }

  private async handleDealDeleted(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`💼 Deal deleted in HubSpot: ${event.objectId}`);
    
    try {
      const quotes = await storage.getQuotesByHubSpotDealId(event.objectId.toString());
      
      for (const quote of quotes) {
        await storage.updateQuote(quote.id, {
          hubspotDealId: null,
          status: 'pending'
        });
      }
    } catch (error) {
      console.error(`❌ Error handling deal deletion webhook:`, error);
    }
  }

  private async handleTicketCreated(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`🎫 New ticket created in HubSpot: ${event.objectId}`);
    // Add logic to handle ticket creation if needed
  }

  private async handleTicketUpdated(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`🎫 Ticket updated in HubSpot: ${event.objectId}, property: ${event.propertyName}`);
    // Add logic to handle ticket updates if needed
  }

  private async handleTicketDeleted(event: HubSpotWebhookPayload): Promise<void> {
    console.log(`🎫 Ticket deleted in HubSpot: ${event.objectId}`);
    // Add logic to handle ticket deletion if needed
  }

  /**
   * Log webhook event for debugging and audit purposes
   */
  async logWebhookEvent(eventType: string, objectType: string, payload: any): Promise<void> {
    try {
      console.log(`📝 Logging webhook event: ${eventType} for ${objectType}`);
      console.log(`📝 Payload:`, JSON.stringify(payload, null, 2));
      
      // In a real implementation, you might want to store these in a database
      // for audit purposes and debugging webhook issues
    } catch (error) {
      console.error('❌ Error logging webhook event:', error);
    }
  }
}

export const webhookService = new WebhookService();