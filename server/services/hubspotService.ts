import { Client } from '@hubspot/api-client';
import type { Assessment, Quote, Organization } from '@shared/schema';

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
      console.error('❌ HUBSPOT_ACCESS_TOKEN environment variable is missing');
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
    }

    console.log('🔑 Initializing HubSpot client with token length:', process.env.HUBSPOT_ACCESS_TOKEN.length);

    try {
      this.client = new Client({
        accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
      });
      console.log('✅ HubSpot client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize HubSpot client:', error);
      throw error;
    }
  }

  /**
   * Create or update a contact in HubSpot from assessment data
   */
  async createOrUpdateContact(assessment: Assessment): Promise<HubSpotContact> {
    try {
      // Generate comprehensive assessment notes
      const assessmentNotes = this.generateAssessmentNotes(assessment);
      
      // Use only standard HubSpot properties to avoid validation errors
      const contactData = {
        email: assessment.customerEmail,
        firstname: assessment.customerContactName?.split(' ')[0] || '',
        lastname: assessment.customerContactName?.split(' ').slice(1).join(' ') || '',
        company: assessment.customerCompanyName || '',
        phone: assessment.customerPhone || '',
        lifecyclestage: 'lead',
        hs_lead_status: 'NEW'
      };

      // Add only the custom properties that exist in HubSpot (based on previous successful syncs)
      const customProperties: any = {};
      
      // Only add these if they exist in your HubSpot account
      if (assessment.serviceType) customProperties.service_type = assessment.serviceType;
      if (assessment.siteAddress) customProperties.site_address = assessment.siteAddress;
      if (assessment.industry) customProperties.industry = assessment.industry;
      if (assessment.preferredInstallationDate) customProperties.preferred_installation_date = assessment.preferredInstallationDate.toISOString();
      if (assessment.id) customProperties.nxtkonekt_assessment_id = assessment.id.toString();

      // Merge standard and custom properties
      const finalContactData = { ...contactData, ...customProperties };

      // Try to find existing contact by email first
      let contact;
      let searchResponse;
      try {
        console.log('🔍 Searching for existing contact with email:', assessment.customerEmail);
        searchResponse = await this.client.crm.contacts.searchApi.doSearch({
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
          console.log('✅ Found existing contact, updating:', searchResponse.results[0].id);
          contact = await this.client.crm.contacts.basicApi.update(
            searchResponse.results[0].id,
            { properties: finalContactData }
          );
          console.log('✅ Contact updated successfully');
          
          // Add assessment notes to existing contact
          await this.addNoteToContact(searchResponse.results[0].id, assessmentNotes);
        } else {
          // Create new contact
          console.log('📝 No existing contact found, creating new contact');
          contact = await this.client.crm.contacts.basicApi.create({
            properties: finalContactData
          });
          console.log('✅ New contact created:', contact.id);
          
          // Add assessment notes to new contact
          await this.addNoteToContact(contact.id, assessmentNotes);
        }
      } catch (searchError) {
        console.log('⚠️ Search failed, creating new contact');
        // If search fails, try to create new contact
        contact = await this.client.crm.contacts.basicApi.create({
          properties: finalContactData
        });
        
        // Add assessment notes to new contact
        await this.addNoteToContact(contact.id, assessmentNotes);
      }

      return {
        id: contact.id,
        email: contact.properties.email,
        firstname: contact.properties.firstname,
        lastname: contact.properties.lastname,
        company: contact.properties.company,
        phone: contact.properties.phone
      };
    } catch (error: any) {
      console.error('❌ Error creating/updating HubSpot contact:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      // Handle property validation errors specifically
      if (error.message && error.message.includes('does not exist')) {
        console.error('🔧 Property validation error - some custom properties may not exist in HubSpot');
        console.error('Contact data sent:', JSON.stringify(finalContactData, null, 2));
        
        // Try with minimal data (standard properties only)
        try {
          console.log('🔄 Retrying with standard properties only...');
          let contact;
          
          if (searchResponse?.results && searchResponse.results.length > 0) {
            contact = await this.client.crm.contacts.basicApi.update(
              searchResponse.results[0].id,
              { properties: contactData }
            );
          } else {
            contact = await this.client.crm.contacts.basicApi.create({
              properties: contactData
            });
          }
          
          console.log('✅ Contact created/updated with standard properties only');
          
          // Add assessment notes with all the detailed information
          await this.addNoteToContact(contact.id, assessmentNotes);
          
          return {
            id: contact.id,
            email: contact.properties.email,
            firstname: contact.properties.firstname,
            lastname: contact.properties.lastname,
            company: contact.properties.company,
            phone: contact.properties.phone
          };
        } catch (retryError) {
          console.error('❌ Retry with standard properties also failed:', retryError);
          throw new Error(`Failed to create/update HubSpot contact even with standard properties: ${retryError}`);
        }
      }
      
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

      // Try to associate deal with contact (graceful fallback for missing scopes)
      try {
        if (contactId) {
          await this.client.crm.deals.associationsApi.create(
            deal.id,
            'contacts',
            contactId,
            [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
          );
        }
      } catch (associationError) {
        console.warn('Deal-Contact association failed (missing scopes), continuing without associations:', associationError);
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
        hs_pipeline: '0', // Default pipeline 
        hs_pipeline_stage: '1', // First stage in pipeline
        hs_ticket_priority: 'MEDIUM',
        source_type: 'OTHER',
        nxtkonekt_quote_number: quote.quoteNumber,
        nxtkonekt_quote_id: quote.id?.toString() || '',
        nxtkonekt_assessment_id: assessment.id?.toString() || ''
      };

      const ticket = await this.client.crm.tickets.basicApi.create({
        properties: ticketData
      });

      // Try associations with graceful fallback for missing scopes
      try {
        if (contactId) {
          await this.client.crm.tickets.associationsApi.create(
            ticket.id,
            'contacts',
            contactId,
            [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 16 }]
          );
        }

        if (dealId) {
          await this.client.crm.tickets.associationsApi.create(
            ticket.id,
            'deals',
            dealId,
            [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 28 }]
          );
        }
      } catch (associationError) {
        console.warn('Association failed (missing scopes), continuing without associations:', associationError);
      }

      return {
        id: ticket.id,
        subject: ticket.properties.subject,
        content: ticket.properties.content,
        priority: ticket.properties.hs_ticket_priority,
        status: ticket.properties.hs_pipeline_stage
      };
    } catch (error: any) {
      console.error('Error creating HubSpot ticket:', error);
      
      // If tickets scope is missing, return a fallback response
      if (error.message && error.message.includes('required scopes')) {
        console.warn('Tickets scope missing, skipping ticket creation');
        return {
          id: 'SCOPE_MISSING',
          subject: `Quote Follow-up: ${quote.quoteNumber} - ${assessment.customerCompanyName}`,
          content: 'Ticket creation skipped - missing HubSpot tickets scope',
          priority: 'MEDIUM',
          status: 'SKIPPED'
        };
      }
      
      // Handle pipeline validation errors
      if (error.message && error.message.includes('pipeline stage')) {
        console.warn('Pipeline stage validation error, skipping ticket creation');
        return {
          id: 'PIPELINE_ERROR',
          subject: `Quote Follow-up: ${quote.quoteNumber} - ${assessment.customerCompanyName}`,
          content: 'Ticket creation skipped - pipeline stage validation error',
          priority: 'MEDIUM',
          status: 'SKIPPED'
        };
      }
      
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
      console.log(`Starting HubSpot sync for quote ${quote.quoteNumber}`);

      // 1. Create/update contact
      const contact = await this.createOrUpdateContact(assessment);
      console.log(`Contact synced: ${contact.id}`);
      
      // 2. Create deal
      const deal = await this.createDeal(quote, assessment, organization, contact.id);
      console.log(`Deal created: ${deal.id}`);
      
      // 3. Create follow-up ticket (with graceful fallback for missing scopes)
      const ticket = await this.createTicket(quote, assessment, contact.id, deal.id);
      if (ticket.id === 'SCOPE_MISSING') {
        console.log('Ticket skipped due to missing HubSpot tickets scope');
      } else {
        console.log(`Ticket created: ${ticket.id}`);
      }

      console.log(`HubSpot sync completed for quote ${quote.quoteNumber}`);
      
      return { contact, deal, ticket };
    } catch (error: any) {
      console.error('❌ HubSpot sync failed for quote', quote.quoteNumber);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Generate comprehensive assessment notes in plain text format
   */
  private generateAssessmentNotes(assessment: Assessment): string {
    const lines = [];
    
    // Header
    lines.push('=== NXTKONEKT ASSESSMENT DETAILS ===');
    lines.push(`Assessment ID: ${assessment.id}`);
    lines.push(`Service Type: ${assessment.serviceType?.toUpperCase().replace('-', ' ')}`);
    lines.push(`Created: ${new Date(assessment.createdAt!).toLocaleDateString()}`);
    lines.push(`Status: ${assessment.status || 'Active'}`);
    if (assessment.totalCost) {
      lines.push(`Total Cost: $${assessment.totalCost}`);
    }
    lines.push('');
    
    // Sales Executive Information
    lines.push('SALES EXECUTIVE:');
    lines.push(`Name: ${assessment.salesExecutiveName || 'N/A'}`);
    lines.push(`Email: ${assessment.salesExecutiveEmail || 'N/A'}`);
    lines.push(`Phone: ${assessment.salesExecutivePhone || 'N/A'}`);
    lines.push('');
    
    // Customer Information
    lines.push('CUSTOMER INFORMATION:');
    lines.push(`Contact: ${assessment.customerContactName || 'N/A'}`);
    lines.push(`Company: ${assessment.customerCompanyName || 'N/A'}`);
    lines.push(`Email: ${assessment.customerEmail || 'N/A'}`);
    lines.push(`Phone: ${assessment.customerPhone || 'N/A'}`);
    lines.push(`Site Address: ${assessment.siteAddress || 'N/A'}`);
    lines.push(`Industry: ${assessment.industry || 'N/A'}`);
    lines.push(`Preferred Install Date: ${assessment.preferredInstallationDate || 'N/A'}`);
    lines.push('');
    
    // Service-specific technical details
    if (assessment.serviceType === 'fixed-wireless') {
      lines.push('FIXED WIRELESS TECHNICAL DETAILS:');
      lines.push('Infrastructure Requirements:');
      lines.push(`- Network Signal: ${assessment.networkSignal || 'N/A'}`);
      lines.push(`- Signal Strength: ${assessment.signalStrength || 'N/A'}`);
      lines.push(`- Connection Usage: ${assessment.connectionUsage || 'N/A'}`);
      lines.push(`- Router Location: ${assessment.routerLocation || 'N/A'}`);
      lines.push(`- Router Count: ${assessment.routerCount || 'N/A'}`);
      lines.push(`- Router Make: ${assessment.routerMake || 'N/A'}`);
      lines.push(`- Router Model: ${assessment.routerModel || 'N/A'}`);
      lines.push(`- Antenna Cable Required: ${assessment.antennaCable || 'N/A'}`);
      lines.push(`- Cable Footage: ${assessment.cableFootage || 'N/A'} ft`);
      lines.push(`- Device Connection Assistance: ${assessment.deviceConnectionAssistance || 'N/A'}`);
      lines.push('');
      lines.push('Site Characteristics:');
      lines.push(`- Building Type: ${assessment.buildingType || 'N/A'}`);
      lines.push(`- Coverage Area: ${assessment.coverageArea || 'N/A'}`);
      lines.push(`- Floors: ${assessment.floors || 'N/A'}`);
      lines.push(`- Device Count: ${assessment.deviceCount || 'N/A'}`);
      lines.push(`- Ceiling Height: ${assessment.ceilingHeight || 'N/A'}`);
      lines.push(`- Ceiling Type: ${assessment.ceilingType || 'N/A'}`);
      lines.push('');
      lines.push('Environmental Factors:');
      lines.push(`- Interference Sources: ${assessment.interferenceSources || 'N/A'}`);
      lines.push(`- Special Requirements: ${assessment.specialRequirements || 'N/A'}`);
      
      if (assessment.antennaType || assessment.routerMounting || assessment.dualWanSupport) {
        lines.push('');
        lines.push('Advanced Configuration:');
        if (assessment.antennaType) lines.push(`- Antenna Type: ${assessment.antennaType}`);
        if (assessment.antennaInstallationLocation) lines.push(`- Antenna Location: ${assessment.antennaInstallationLocation}`);
        if (assessment.routerMounting) lines.push(`- Router Mounting: ${assessment.routerMounting}`);
        if (assessment.dualWanSupport) lines.push(`- Dual WAN Support: ${assessment.dualWanSupport}`);
      }
    }
    
    if (assessment.serviceType === 'fleet-tracking') {
      lines.push('FLEET TRACKING TECHNICAL DETAILS:');
      lines.push(`- Total Fleet Size: ${assessment.totalFleetSize || 'N/A'}`);
      lines.push(`- Vehicles for Installation: ${assessment.deviceCount || 'N/A'}`);
      lines.push(`- Tracker Type: ${assessment.trackerType || 'N/A'}`);
      lines.push(`- IoT Tracking Partner: ${assessment.iotTrackingPartner || 'N/A'}`);
      lines.push(`- Carrier SIM: ${assessment.carrierSim || 'N/A'}`);
      lines.push('');
      
      // Try to parse vehicle details from JSON field or fallback to individual fields
      lines.push('Vehicle Details:');
      try {
        if ((assessment as any).vehicleDetails) {
          const vehicleDetails = JSON.parse((assessment as any).vehicleDetails);
          if (Array.isArray(vehicleDetails) && vehicleDetails.length > 0) {
            vehicleDetails.forEach((vehicle, index) => {
              lines.push(`Vehicle ${index + 1}:`);
              lines.push(`  - Year: ${vehicle.year || 'N/A'}`);
              lines.push(`  - Make: ${vehicle.make || 'N/A'}`);
              lines.push(`  - Model: ${vehicle.model || 'N/A'}`);
            });
          } else {
            lines.push('- No vehicle details available');
          }
        } else {
          // Fallback to individual fields
          lines.push(`- Vehicle Year: ${assessment.vehicleYear || 'N/A'}`);
          lines.push(`- Vehicle Make: ${assessment.vehicleMake || 'N/A'}`);
          lines.push(`- Vehicle Model: ${assessment.vehicleModel || 'N/A'}`);
        }
      } catch (error) {
        // Fallback to individual fields if JSON parsing fails
        lines.push(`- Vehicle Year: ${assessment.vehicleYear || 'N/A'}`);
        lines.push(`- Vehicle Make: ${assessment.vehicleMake || 'N/A'}`);
        lines.push(`- Vehicle Model: ${assessment.vehicleModel || 'N/A'}`);
      }
    }
    
    if (assessment.serviceType === 'fleet-camera') {
      lines.push('FLEET CAMERA TECHNICAL DETAILS:');
      lines.push(`- Camera Solution Type: ${assessment.cameraSolutionType || 'N/A'}`);
      lines.push(`- Number of Cameras: ${assessment.numberOfCameras || 'N/A'}`);
      lines.push(`- Vehicles for Installation: ${assessment.deviceCount || 'N/A'}`);
      lines.push(`- Carrier SIM: ${assessment.carrierSim || 'N/A'}`);
      lines.push('');
      
      if (assessment.removalNeeded === 'yes') {
        lines.push('Existing System Removal:');
        lines.push(`- Removal Required: Yes`);
        lines.push(`- Existing Camera Solution: ${assessment.existingCameraSolution || 'N/A'}`);
        if (assessment.otherSolutionDetails) {
          lines.push(`- Other Solution Details: ${assessment.otherSolutionDetails}`);
        }
        lines.push('');
      }
      
      // Try to parse vehicle details from JSON field or fallback to individual fields
      lines.push('Vehicle Details:');
      try {
        if ((assessment as any).vehicleDetails) {
          const vehicleDetails = JSON.parse((assessment as any).vehicleDetails);
          if (Array.isArray(vehicleDetails) && vehicleDetails.length > 0) {
            vehicleDetails.forEach((vehicle, index) => {
              lines.push(`Vehicle ${index + 1}:`);
              lines.push(`  - Year: ${vehicle.year || 'N/A'}`);
              lines.push(`  - Make: ${vehicle.make || 'N/A'}`);
              lines.push(`  - Model: ${vehicle.model || 'N/A'}`);
            });
          } else {
            lines.push('- No vehicle details available');
          }
        } else {
          // Fallback to individual fields
          lines.push(`- Vehicle Year: ${assessment.vehicleYear || 'N/A'}`);
          lines.push(`- Vehicle Make: ${assessment.vehicleMake || 'N/A'}`);
          lines.push(`- Vehicle Model: ${assessment.vehicleModel || 'N/A'}`);
        }
      } catch (error) {
        // Fallback to individual fields if JSON parsing fails
        lines.push(`- Vehicle Year: ${assessment.vehicleYear || 'N/A'}`);
        lines.push(`- Vehicle Make: ${assessment.vehicleMake || 'N/A'}`);
        lines.push(`- Vehicle Model: ${assessment.vehicleModel || 'N/A'}`);
      }
    }
    
    // Additional Notes
    if (assessment.additionalNotes) {
      lines.push('');
      lines.push('ADDITIONAL NOTES:');
      lines.push(assessment.additionalNotes);
    }
    
    lines.push('');
    lines.push(`Generated by NXTKonekt Admin System on ${new Date().toLocaleDateString()}`);
    
    return lines.join('\n');
  }

  /**
   * Add a note to a HubSpot contact
   */
  private async addNoteToContact(contactId: string, noteContent: string): Promise<void> {
    try {
      const noteData = {
        properties: {
          hs_note_body: noteContent,
          hs_timestamp: new Date().getTime().toString(),
          hubspot_owner_id: '' // Optional: set owner if needed
        },
        associations: [
          {
            to: {
              id: contactId
            },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 202 // Note to Contact association
              }
            ]
          }
        ]
      };

      await this.client.crm.objects.notes.basicApi.create(noteData);
      console.log(`✅ Assessment note added to contact ${contactId}`);
    } catch (error) {
      console.error('⚠️ Failed to add note to contact:', error);
      // Don't throw error to prevent contact creation from failing
    }
  }

  /**
   * Test HubSpot connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing HubSpot connection...');
      console.log('Token length:', process.env.HUBSPOT_ACCESS_TOKEN?.length || 0);
      
      // Try a simple API call to test authentication
      const response = await this.client.crm.contacts.basicApi.getPage(undefined, undefined, undefined, undefined, undefined, 1);
      console.log('✅ HubSpot connection successful, found', response.results?.length || 0, 'contacts');
      return true;
    } catch (error: any) {
      console.error('❌ HubSpot connection test failed:');
      console.error('- Error type:', error.constructor.name);
      console.error('- Error message:', error.message);
      console.error('- Status code:', error.code || error.status);
      console.error('- Response body:', error.body || error.response?.data);
      console.error('- Full error:', JSON.stringify(error, null, 2));
      
      // Check for missing scopes specifically
      if (error.message && error.message.includes('required scopes')) {
        console.error('❌ MISSING HUBSPOT SCOPES - Please update your private app permissions');
      }
      
      return false;
    }
  }
}

export const hubspotService = new HubSpotService();