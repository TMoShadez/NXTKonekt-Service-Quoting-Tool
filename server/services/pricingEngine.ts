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

  // Fixed Wireless Access pricing (updated logic)
  let surveyHours = 0; // New base: 0 hours
  let installationHours = 2; // New base: 2 hours
  let configurationHours = 1; // New base: 1 hour

  const coverageArea = assessment.coverageArea || 1000;
  const deviceCount = assessment.deviceCount || 1;

  // Coverage area complexity adjustments
  if (coverageArea > 5000) {
    surveyHours += 2;
    installationHours += 2;
  } else if (coverageArea > 2500) {
    surveyHours += 1;
    installationHours += 1;
  }

  // Device count logic: 1 device included, 2-5 devices with failover +1 config hour, 
  // 6-9 devices +1 config hour, >10 devices +2 config hours
  if (deviceCount === 1) {
    // Base configuration - 1 hour
  } else if (deviceCount >= 2 && deviceCount <= 5) {
    // Check if failover connection
    if (assessment.connectionUsage === 'failover') {
      configurationHours += 1;
    }
  } else if (deviceCount >= 6 && deviceCount <= 9) {
    configurationHours += 1;
  } else if (deviceCount >= 10) {
    configurationHours += 2;
  }

  // Signal strength adjustments (when 3 bars, additional complexity)
  if (assessment.signalStrength === '3') {
    surveyHours += 1;
    installationHours += 1;
  }

  // Calculate costs
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const configurationCost = Math.round(configurationHours * HOURLY_RATE * 100) / 100;
  const trainingCost = 0; // Training included
  
  // Ethernet cable pricing - $7 per foot
  let cableCost = 0;
  if (assessment.cableFootage) {
    const footage = parseFloat(assessment.cableFootage) || 0;
    cableCost = footage * 7;
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
  let surveyHours = 0; // New base: 0 hours
  let installationHours = 2; // New base: 2 hours
  
  const vehicleCount = assessment.deviceCount || 1;
  
  // Fleet Tracker OBD installation includes up to 3 vehicles in base rate
  const billableVehicles = Math.max(0, vehicleCount - 3);
  
  // Base installation covers up to 3 vehicles
  if (billableVehicles > 0) {
    installationHours += billableVehicles * 0.5; // 30 minutes per additional vehicle
  }
  
  // Complexity adjustments based on vehicle types
  if (assessment.buildingType === 'heavy-duty' || assessment.buildingType === 'specialized') {
    installationHours += 1; // Reduced from 2 to 1
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
    hardwareCost: 0,
    totalCost,
    surveyHours,
    installationHours,
    configurationHours: 0,
    hourlyRate: HOURLY_RATE,
  };
}

function calculateFleetCameraPricing(assessment: Assessment): PricingBreakdown {
  let surveyHours = 0; // New base: 0 hours
  let installationHours = 2; // New base: 2 hours
  
  const vehicleCount = assessment.deviceCount || 1;
  
  // Camera installation is per vehicle - 2 base hours + 1 hour per vehicle
  installationHours = 2 + (vehicleCount * 1); // Updated: 1 hour per vehicle instead of 1.5
  
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
    hardwareCost: 0,
    totalCost,
    surveyHours,
    installationHours,
    configurationHours: 0,
    hourlyRate: HOURLY_RATE,
  };
}