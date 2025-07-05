import { Assessment } from '@shared/schema';

export interface PricingBreakdown {
  surveyCost: number;
  installationCost: number;
  configurationCost: number;
  trainingCost: number;
  hardwareCost: number;
  totalCost: number;
  // Hours breakdown for display
  surveyHours: number;
  installationHours: number;
  configurationHours: number;
  laborHoldHours: number;
  laborHoldCost: number;
  hourlyRate: number;
}

// Base hourly rate (including taxes)
const HOURLY_RATE = 190;

export function calculatePricing(assessment: Assessment): PricingBreakdown {
  const serviceType = assessment.serviceType || 'site-assessment';
  
  // Service-specific pricing calculations
  if (serviceType === 'fleet-tracking') {
    return calculateFleetTrackingPricing(assessment);
  } else if (serviceType === 'fleet-camera') {
    return calculateFleetCameraPricing(assessment);
  }

  // Fixed Wireless Access pricing - based on router count with +1 labor hold hour
  let surveyHours = 0;
  let configurationHours = 1;
  
  const routerCount = assessment.routerCount || 1;
  
  // Installation hours based on number of routers to be installed
  let installationHours = routerCount * 1; // 1 hour per router
  
  // Add exactly 1 additional labor hold hour
  const laborHoldHours = 1;

  // Calculate costs
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const configurationCost = Math.round(configurationHours * HOURLY_RATE * 100) / 100;
  const laborHoldCost = Math.round(laborHoldHours * HOURLY_RATE * 100) / 100;
  const trainingCost = 0; // Training included
  
  // Ethernet cable pricing - $14.50 per foot
  let cableCost = 0;
  if (assessment.cableFootage) {
    const footage = parseFloat(assessment.cableFootage) || 0;
    cableCost = footage * 14.50;
  }
  
  const totalCost = Math.round((surveyCost + installationCost + configurationCost + laborHoldCost + cableCost) * 100) / 100;

  return {
    surveyCost,
    installationCost,
    configurationCost,
    trainingCost,
    hardwareCost: cableCost,
    totalCost,
    surveyHours,
    installationHours,
    configurationHours,
    laborHoldHours,
    laborHoldCost,
    hourlyRate: HOURLY_RATE,
  };
}

function calculateFleetTrackingPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 0;
  let installationHours = 1;
  
  // Add exactly 1 additional labor hold hour
  const laborHoldHours = 1;
  
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const laborHoldCost = Math.round(laborHoldHours * HOURLY_RATE * 100) / 100;
  const configurationCost = 0; // Included in service
  const trainingCost = 0; // Included in service
  const totalCost = Math.round((surveyCost + installationCost + laborHoldCost) * 100) / 100;

  return {
    surveyCost,
    installationCost,
    configurationCost,
    trainingCost,
    hardwareCost: 0,
    totalCost,
    surveyHours,
    installationHours,
    configurationHours: 0,
    laborHoldHours,
    laborHoldCost,
    hourlyRate: HOURLY_RATE,
  };
}

function calculateFleetCameraPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 0;
  let installationHours = 1;
  
  // Add exactly 1 additional labor hold hour
  const laborHoldHours = 1;
  
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const laborHoldCost = Math.round(laborHoldHours * HOURLY_RATE * 100) / 100;
  const configurationCost = 0; // Included in service
  const trainingCost = 0; // Included in service
  const totalCost = Math.round((surveyCost + installationCost + laborHoldCost) * 100) / 100;

  return {
    surveyCost,
    installationCost,
    configurationCost,
    trainingCost,
    hardwareCost: 0,
    totalCost,
    surveyHours,
    installationHours,
    configurationHours: 0,
    laborHoldHours,
    laborHoldCost,
    hourlyRate: HOURLY_RATE,
  };
}