import { Client } from '@hubspot/api-client';
import type { Assessment, Quote, Organization } from '@shared/schema';

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

export interface HubSpotContact {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  company: string;
  phone: string;
}

export interface HubSpotDeal {
  id: string;
  dealname: string;
  amount: string;
  pipeline: string;
  dealstage: string;
}

export interface HubSpotTicket {
  id: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
}

export class HubSpotService {
  private client: Client;

  constructor() {
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
    }
    this.client = hubspotClient;
  }

  /**
   * Create or update a contact in HubSpot from assessment data
   */
  async createOrUpdateContact(assessment: Assessment): Promise<HubSpotContact> {
    try {
      const contactData = {
        email: assessment.customerEmail,
        firstname: assessment.customerContactName?.split(' ')[0] || '',
        lastname: assessment.customerContactName?.split(' ').slice(1).join(' ') || '',
        company: assessment.customerCompanyName || '',
        phone: assessment.customerPhone || '',
        industry: assessment.industry || '',
        site_address: assessment.siteAddress || '',
        preferred_installation_date: assessment.preferredInstallationDate?.toISOString() || '',
        service_type: assessment.serviceType || '',
        nxtkonekt_assessment_id: assessment.id?.toString() || '',
        lead_source: 'NXTKonekt Assessment Tool'
      };

      // Try to find existing contact by email first
      let contact;
      try {
        const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: assessment.customerEmail
                }
              ]
            }
          ],
          properties: ['email', 'firstname', 'lastname', 'company', 'phone'],
          limit: 1
        });

        if (searchResponse.results && searchResponse.results.length > 0) {
          // Update existing contact
          contact = await this.client.crm.contacts.basicApi.update(
            searchResponse.results[0].id,
            { properties: contactData }
          );
        } else {
          // Create new contact
          contact = await this.client.crm.contacts.basicApi.create({
            properties: contactData
          });
        }
      } catch (searchError) {
        // If search fails, try to create new contact
        contact = await this.client.crm.contacts.basicApi.create({
          properties: contactData
        });
      }

      return {
        id: contact.id,
        email: contact.properties.email,
        firstname: contact.properties.firstname,
        lastname: contact.properties.lastname,
        company: contact.properties.company,
        phone: contact.properties.phone
      };
    } catch (error) {
      console.error('Error creating/updating HubSpot contact:', error);
      throw new Error(`Failed to create/update HubSpot contact: ${error}`);
    }
  }

  /**
   * Create a deal in HubSpot from quote data
   */
  async createDeal(quote: Quote, assessment: Assessment, organization: Organization, contactId?: string): Promise<HubSpotDeal> {
    try {
      const dealData = {
        dealname: `${assessment.customerCompanyName} - ${assessment.serviceType} - ${quote.quoteNumber}`,
        amount: quote.totalCost,
        pipeline: 'default', // You may want to customize this
        dealstage: 'appointmentscheduled', // Initial stage - customize as needed
        closedate: assessment.preferredInstallationDate?.toISOString() || '',
        dealtype: 'newbusiness',
        description: `NXTKonekt ${assessment.serviceType} installation quote for ${assessment.customerCompanyName}`,
        nxtkonekt_quote_number: quote.quoteNumber,
        nxtkonekt_quote_id: quote.id?.toString() || '',
        nxtkonekt_assessment_id: assessment.id?.toString() || '',
        service_type: assessment.serviceType,
        site_address: assessment.siteAddress,
        sales_executive: assessment.salesExecutiveName,
        quote_status: quote.status,
        lead_source: 'NXTKonekt Assessment Tool'
      };

      const deal = await this.client.crm.deals.basicApi.create({
        properties: dealData
      });

      // Associate deal with contact if contactId is provided
      if (contactId) {
        await this.client.crm.deals.associationsApi.create(
          deal.id,
          'contacts',
          contactId,
          [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Deal to Contact association
        );
      }

      return {
        id: deal.id,
        dealname: deal.properties.dealname,
        amount: deal.properties.amount,
        pipeline: deal.properties.pipeline,
        dealstage: deal.properties.dealstage
      };
    } catch (error) {
      console.error('Error creating HubSpot deal:', error);
      throw new Error(`Failed to create HubSpot deal: ${error}`);
    }
  }

  /**
   * Create a ticket for quote follow-up
   */
  async createTicket(quote: Quote, assessment: Assessment, contactId?: string, dealId?: string): Promise<HubSpotTicket> {
    try {
      const ticketData = {
        subject: `Quote Follow-up: ${quote.quoteNumber} - ${assessment.customerCompanyName}`,
        content: `Follow-up required for NXTKonekt quote ${quote.quoteNumber}.\n\nCustomer: ${assessment.customerCompanyName}\nContact: ${assessment.customerContactName}\nService: ${assessment.serviceType}\nQuote Amount: $${quote.totalCost}\nStatus: ${quote.status}\n\nSales Executive: ${assessment.salesExecutiveName}`,
        hs_pipeline: 'support_pipeline', // Customize as needed
        hs_pipeline_stage: 'new', // Customize as needed
        hs_ticket_priority: 'MEDIUM',
        source_type: 'OTHER',
        nxtkonekt_quote_number: quote.quoteNumber,
        nxtkonekt_quote_id: quote.id?.toString() || '',
        nxtkonekt_assessment_id: assessment.id?.toString() || ''
      };

      const ticket = await this.client.crm.tickets.basicApi.create({
        properties: ticketData
      });

      // Associate ticket with contact
      if (contactId) {
        await this.client.crm.tickets.associationsApi.create(
          ticket.id,
          'contacts',
          contactId,
          [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 16 }] // Ticket to Contact association
        );
      }

      // Associate ticket with deal
      if (dealId) {
        await this.client.crm.tickets.associationsApi.create(
          ticket.id,
          'deals',
          dealId,
          [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 28 }] // Ticket to Deal association
        );
      }

      return {
        id: ticket.id,
        subject: ticket.properties.subject,
        content: ticket.properties.content,
        priority: ticket.properties.hs_ticket_priority,
        status: ticket.properties.hs_pipeline_stage
      };
    } catch (error) {
      console.error('Error creating HubSpot ticket:', error);
      throw new Error(`Failed to create HubSpot ticket: ${error}`);
    }
  }

  /**
   * Update deal status when quote is approved/rejected
   */
  async updateDealStatus(quoteId: number, status: 'approved' | 'rejected'): Promise<void> {
    try {
      // Find deal by quote ID
      const searchResponse = await this.client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'nxtkonekt_quote_id',
                operator: 'EQ',
                value: quoteId.toString()
              }
            ]
          }
        ],
        properties: ['dealname', 'dealstage'],
        limit: 1
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        const dealId = searchResponse.results[0].id;
        const newStage = status === 'approved' ? 'closedwon' : 'closedlost';
        
        await this.client.crm.deals.basicApi.update(dealId, {
          properties: {
            dealstage: newStage,
            quote_status: status,
            closedate: new Date().toISOString()
          }
        });

        console.log(`Updated HubSpot deal ${dealId} status to ${newStage}`);
      }
    } catch (error) {
      console.error('Error updating HubSpot deal status:', error);
      throw new Error(`Failed to update HubSpot deal status: ${error}`);
    }
  }

  /**
   * Complete HubSpot sync for new quote
   */
  async syncQuoteToHubSpot(quote: Quote, assessment: Assessment, organization: Organization): Promise<{
    contact: HubSpotContact;
    deal: HubSpotDeal;
    ticket: HubSpotTicket;
  }> {
    try {
      // 1. Create/update contact
      const contact = await this.createOrUpdateContact(assessment);
      
      // 2. Create deal
      const deal = await this.createDeal(quote, assessment, organization, contact.id);
      
      // 3. Create follow-up ticket
      const ticket = await this.createTicket(quote, assessment, contact.id, deal.id);

      console.log(`Successfully synced quote ${quote.quoteNumber} to HubSpot`);
      
      return { contact, deal, ticket };
    } catch (error) {
      console.error('Error syncing quote to HubSpot:', error);
      throw error;
    }
  }

  /**
   * Test HubSpot connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.crm.owners.getAll();
      return true;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }
}

export const hubspotService = new HubSpotService();