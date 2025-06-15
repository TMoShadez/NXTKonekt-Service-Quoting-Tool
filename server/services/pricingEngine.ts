import { Assessment } from '@shared/schema';

export interface PricingBreakdown {
  surveyCost: number;
  installationCost: number;
  configurationCost: number;
  trainingCost: number;
  totalCost: number;
}

// Base hourly rate (including taxes)
const HOURLY_RATE = 190;

export function calculatePricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 4; // Base survey hours
  let installationHours = 8; // Base installation hours
  let configurationHours = 4; // Base configuration hours
  let trainingHours = 2; // Base training hours

  // Adjust hours based on assessment data
  const coverageArea = assessment.coverageArea || 1000;
  const deviceCount = assessment.deviceCount || 20;
  const floors = assessment.floors || 1;

  // Coverage area adjustments
  if (coverageArea > 5000) {
    surveyHours += 2;
    installationHours += 6;
    configurationHours += 2;
  } else if (coverageArea > 2500) {
    surveyHours += 1;
    installationHours += 3;
    configurationHours += 1;
  }

  // Device count adjustments
  if (deviceCount > 100) {
    installationHours += 4;
    configurationHours += 3;
    trainingHours += 2;
  } else if (deviceCount > 50) {
    installationHours += 2;
    configurationHours += 2;
    trainingHours += 1;
  }

  // Multi-floor adjustments
  if (floors > 3) {
    surveyHours += 2;
    installationHours += 4;
  } else if (floors > 1) {
    surveyHours += 1;
    installationHours += 2;
  }

  // Special requirements adjustments
  if (assessment.ceilingMount) {
    installationHours += 2;
  }

  if (assessment.outdoorCoverage) {
    surveyHours += 1;
    installationHours += 3;
  }

  if (assessment.ethernetRequired) {
    installationHours += 2;
    configurationHours += 1;
  }

  // Complex building type adjustments
  if (assessment.buildingType === 'warehouse') {
    surveyHours += 1;
    installationHours += 2;
  } else if (assessment.buildingType === 'office-complex') {
    surveyHours += 2;
    configurationHours += 2;
    trainingHours += 1;
  }

  // Calculate costs - Configuration & Testing and Documentation & Training are included
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
    totalCost,
  };
}
