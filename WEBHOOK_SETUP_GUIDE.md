# HubSpot Webhook Integration Setup Guide

## Overview
This guide explains how to set up webhooks between your NXTKonekt application and HubSpot for bidirectional data synchronization. Webhooks enable real-time updates when data changes in either system.

## What You'll Achieve
- **Real-time contact sync**: When contacts are created/updated in HubSpot, your assessments are automatically linked
- **Deal stage tracking**: When deal stages change in HubSpot, quote statuses update automatically  
- **Automated property creation**: Missing custom properties are created in HubSpot automatically
- **Bidirectional data flow**: Changes in either system trigger updates in the other

## Prerequisites
1. **HubSpot Private App** with appropriate scopes
2. **Webhook Secret** for secure webhook verification (optional but recommended)
3. **Admin access** to your NXTKonekt application

## Step 1: Configure HubSpot Webhook Secret (Optional)

### 1.1 Set Webhook Secret Environment Variable
```bash
# Add to your environment variables
HUBSPOT_WEBHOOK_SECRET=your_webhook_secret_here
```

### 1.2 Generate a Secure Secret
```bash
# Generate a random 32-byte secret
openssl rand -hex 32
```

## Step 2: Set Up Custom Properties in HubSpot

### 2.1 Automatic Setup (Recommended)
Your application includes an admin endpoint to automatically create all required custom properties:

```bash
# Call this endpoint as an admin user
POST /api/admin/hubspot/setup-properties
```

### 2.2 Manual Setup (Alternative)
If you prefer to create properties manually in HubSpot:

#### Contact Properties:
- `lead_source` (Single-line text)
- `site_address` (Single-line text) 
- `sales_executive` (Single-line text)

#### Deal Properties:
- `nxtkonekt_quote_number` (Single-line text)
- `nxtkonekt_quote_id` (Single-line text)
- `nxtkonekt_assessment_id` (Single-line text)
- `service_type` (Dropdown: Fixed Wireless, Fleet Tracking, Fleet Camera)
- `quote_status` (Dropdown: Pending, Sent, In Progress, Approved, Rejected)

## Step 3: Configure HubSpot Webhooks

### 3.1 Access HubSpot Webhook Settings
1. Go to HubSpot Settings → Integrations → Private Apps
2. Select your NXTKonekt private app
3. Navigate to the "Webhooks" tab

### 3.2 Create Contact Webhooks
**Target URL**: `https://your-domain.com/api/webhooks/hubspot/contacts`

**Subscribe to Events**:
- `contact.creation`
- `contact.propertyChange`
- `contact.deletion`

### 3.3 Create Deal Webhooks  
**Target URL**: `https://your-domain.com/api/webhooks/hubspot/deals`

**Subscribe to Events**:
- `deal.creation`
- `deal.propertyChange` 
- `deal.deletion`

### 3.4 Create Ticket Webhooks (Optional)
**Target URL**: `https://your-domain.com/api/webhooks/hubspot/tickets`

**Subscribe to Events**:
- `ticket.creation`
- `ticket.propertyChange`
- `ticket.deletion`

### 3.5 Configure Webhook Authentication
If using webhook verification:
1. Set "Webhook signature" to your `HUBSPOT_WEBHOOK_SECRET`
2. Choose "SHA256" as the signature method

## Step 4: Test Webhook Integration

### 4.1 Test Webhook Endpoints
Your application includes testing endpoints:

```bash
# Test contact webhook processing
POST /api/admin/webhooks/test
{
  "webhookType": "contact",
  "testData": [
    {
      "eventId": 1,
      "subscriptionId": 1,
      "portalId": 12345,
      "objectId": 123,
      "subscriptionType": "contact.creation",
      "occurredAt": 1634567890000
    }
  ]
}

# Test deal webhook processing  
POST /api/admin/webhooks/test
{
  "webhookType": "deal",
  "testData": [...]
}
```

### 4.2 Monitor Webhook Activity
Check your application logs for webhook processing messages:
- `📧 Processing contact webhook events`
- `💼 Processing deal webhook events`
- `✅ Webhook processed successfully`

## Step 5: Verify Data Synchronization

### 5.1 Test Contact Sync
1. Create a new contact in HubSpot with an email that matches an assessment
2. Check that the assessment gets updated with `hubspotContactId`
3. Verify bidirectional sync by updating contact properties

### 5.2 Test Deal Sync
1. Create or update a deal in HubSpot
2. If deal name contains a quote number, verify the quote gets linked
3. Change deal stage and verify quote status updates accordingly

## Webhook Event Processing

### Contact Events
- **Creation**: Links existing assessments to new HubSpot contact
- **Updates**: Syncs contact property changes to assessments
- **Deletion**: Removes HubSpot references from assessments

### Deal Events  
- **Creation**: Links deals to quotes based on deal name patterns
- **Stage Changes**: Updates quote status based on deal stage:
  - `closedwon` → `approved`
  - `closedlost` → `rejected`  
  - `contractsent` → `sent`
  - Other stages → `in_progress`
- **Deletion**: Removes HubSpot references and resets quote status

## Webhook URLs Summary

Replace `your-domain.com` with your actual domain:

```
Contact Webhooks: https://your-domain.com/api/webhooks/hubspot/contacts
Deal Webhooks:    https://your-domain.com/api/webhooks/hubspot/deals  
Ticket Webhooks:  https://your-domain.com/api/webhooks/hubspot/tickets
```

## Troubleshooting

### Common Issues

**1. "Invalid signature" errors**
- Verify `HUBSPOT_WEBHOOK_SECRET` matches HubSpot configuration
- Check that webhook signature method is set to SHA256

**2. "Property doesn't exist" errors**  
- Run the property setup endpoint: `POST /api/admin/hubspot/setup-properties`
- Verify custom properties exist in HubSpot settings

**3. Webhook not processing**
- Check webhook URL is accessible from internet
- Verify webhook events are configured in HubSpot
- Review application logs for error messages

**4. Data not syncing**
- Ensure assessment emails match HubSpot contact emails exactly
- Check that deal names contain recognizable quote numbers
- Verify HubSpot API scopes include required permissions

### Debug Mode
Enable detailed webhook logging by checking application console output:
```bash
# Look for these log messages
📝 Logging webhook event: contact for contact
🔗 Found related quote: Q-2025-0001
🔄 Updated quote Q-2025-0001 status to approved
```

## Security Considerations

1. **Use HTTPS**: All webhook URLs must use HTTPS in production
2. **Verify signatures**: Always verify webhook signatures to prevent unauthorized requests
3. **Rate limiting**: Consider implementing rate limiting for webhook endpoints
4. **Error handling**: Implement proper error handling to prevent webhook failures from breaking functionality

## Next Steps

After completing webhook setup:
1. Monitor webhook activity in application logs
2. Test various scenarios (contact creation, deal updates, etc.)
3. Verify data consistency between systems
4. Set up monitoring/alerting for webhook failures
5. Consider implementing webhook retry logic for failed events

Your HubSpot integration now supports real-time bidirectional synchronization, significantly improving data consistency and workflow automation between your NXTKonekt application and HubSpot CRM.