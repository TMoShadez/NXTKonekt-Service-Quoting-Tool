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

  // Fixed Wireless Access pricing - simplified logic with +1 hour labor
  let surveyHours = 0;
  let installationHours = 2;
  let configurationHours = 1;

  // Add one additional hour of labor regardless of device count or complexity
  installationHours += 1;

  // Calculate costs
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const configurationCost = Math.round(configurationHours * HOURLY_RATE * 100) / 100;
  const trainingCost = 0; // Training included
  
  // Ethernet cable pricing - $14.50 per foot
  let cableCost = 0;
  if (assessment.cableFootage) {
    const footage = parseFloat(assessment.cableFootage) || 0;
    cableCost = footage * 14.50;
  }
  
  const totalCost = Math.round((surveyCost + installationCost + configurationCost + cableCost) * 100) / 100;

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
    hourlyRate: HOURLY_RATE,
  };
}

function calculateFleetTrackingPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 0;
  let installationHours = 2;
  
  // Add one additional hour of labor regardless of device count or complexity
  installationHours += 1;
  
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const configurationCost = 0; // Included in service
  const trainingCost = 0; // Included in service
  const totalCost = Math.round((surveyCost + installationCost) * 100) / 100;

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
    hourlyRate: HOURLY_RATE,
  };
}

function calculateFleetCameraPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 0;
  let installationHours = 2;
  
  // Add one additional hour of labor regardless of device count or complexity
  installationHours += 1;
  
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const configurationCost = 0; // Included in service
  const trainingCost = 0; // Included in service
  const totalCost = Math.round((surveyCost + installationCost) * 100) / 100;

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
    hourlyRate: HOURLY_RATE,
  };
}