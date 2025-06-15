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
  const serviceType = assessment.serviceType || 'fixed-wireless';
  let surveyHours = 4; // Base survey hours
  let installationHours = 8; // Base installation hours
  let configurationHours = 4; // Base configuration hours
  let trainingHours = 2; // Base training hours

  // Service-specific pricing calculations
  if (serviceType === 'fleet-tracking') {
    return calculateFleetTrackingPricing(assessment);
  } else if (serviceType === 'fleet-camera') {
    return calculateFleetCameraPricing(assessment);
  }

  // Fixed Wireless Access pricing (existing logic)
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

function calculateFleetTrackingPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 2; // Base survey hours for fleet assessment
  let installationHours = 4; // Base installation hours
  
  const vehicleCount = assessment.deviceCount || 1;
  
  // Fleet Tracker OBD installation includes up to 3 vehicles in hourly rate
  const billableVehicles = Math.max(0, vehicleCount - 3);
  
  // Base installation covers up to 3 vehicles
  if (billableVehicles > 0) {
    installationHours += billableVehicles * 0.5; // 30 minutes per additional vehicle
  }
  
  // Complexity adjustments based on vehicle types
  if (assessment.buildingType === 'heavy-duty' || assessment.buildingType === 'specialized') {
    installationHours += 2;
  } else if (assessment.buildingType === 'mixed-fleet') {
    installationHours += 1;
  }
  
  // Feature complexity adjustments
  let featureCount = 0;
  if (assessment.powerAvailable) featureCount++; // Real-time GPS
  if (assessment.ethernetRequired) featureCount++; // Geofencing
  if (assessment.ceilingMount) featureCount++; // Driver behavior
  if (assessment.outdoorCoverage) featureCount++; // Maintenance scheduling
  
  if (featureCount > 2) {
    installationHours += 1;
  }
  
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

function calculateFleetCameraPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 3; // Base survey hours for camera assessment
  let installationHours = 6; // Base installation hours
  
  const vehicleCount = assessment.deviceCount || 1;
  
  // Camera installation is per vehicle
  installationHours = 2 + (vehicleCount * 1.5); // 2 hours base + 1.5 hours per vehicle
  
  // Camera type complexity adjustments
  let cameraCount = 0;
  if (assessment.powerAvailable) cameraCount++; // Forward camera
  if (assessment.ethernetRequired) cameraCount++; // Driver camera
  if (assessment.ceilingMount) cameraCount++; // Side cameras
  if (assessment.outdoorCoverage) cameraCount++; // Rear camera
  
  // Additional time for multiple camera types
  if (cameraCount > 2) {
    installationHours += vehicleCount * 0.5; // 30 minutes per vehicle for complex setups
  }
  
  // Installation complexity adjustments
  if (assessment.buildingType === 'custom' || assessment.buildingType === 'retrofit') {
    installationHours += vehicleCount * 0.5;
  }
  
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
