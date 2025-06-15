import { Assessment } from '@shared/schema';

export interface PricingBreakdown {
  surveyCost: number;
  installationCost: number;
  configurationCost: number;
  trainingCost: number;
  totalCost: number;
}

// Base hourly rates
const HOURLY_RATES = {
  survey: 125,
  installation: 95,
  configuration: 110,
  training: 85,
};

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

  // Calculate costs
  const surveyCost = Math.round(surveyHours * HOURLY_RATES.survey * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATES.installation * 100) / 100;
  const configurationCost = Math.round(configurationHours * HOURLY_RATES.configuration * 100) / 100;
  const trainingCost = Math.round(trainingHours * HOURLY_RATES.training * 100) / 100;
  const totalCost = Math.round((surveyCost + installationCost + configurationCost + trainingCost) * 100) / 100;

  return {
    surveyCost,
    installationCost,
    configurationCost,
    trainingCost,
    totalCost,
  };
}
