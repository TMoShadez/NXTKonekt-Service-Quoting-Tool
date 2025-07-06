import { Assessment } from '@shared/schema';

export interface PricingBreakdown {
  surveyCost: number;
  installationCost: number;
  configurationCost: number;
  trainingCost: number;
  hardwareCost: number;
  removalCost?: number;
  totalCost: number;
  // Hours breakdown for display
  surveyHours: number;
  installationHours: number;
  configurationHours: number;
  removalHours?: number;
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
  
  // Use deviceCount (number of vehicles for installation) to determine base hours
  const deviceCount = assessment.deviceCount || 1;
  let installationHours = 1; // Default to 1 hour
  
  // Check if OBD Port Installation is selected for special pricing
  if (assessment.ceilingType === 'obd-port') {
    // For OBD Port Installation: 1 base hour covers up to 3 vehicles
    installationHours = Math.ceil(deviceCount / 3);
  } else {
    // For other installation types: 1 hour per vehicle
    installationHours = deviceCount;
  }
  
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
  
  // Base calculation: 1 hour per vehicle (includes 1 camera per vehicle)
  const vehicleCount = assessment.deviceCount || 1;
  let installationHours = vehicleCount;
  
  // Additional labor for extra cameras beyond 1 per vehicle
  const numberOfCameras = assessment.numberOfCameras || vehicleCount;
  if (numberOfCameras > vehicleCount) {
    const extraCameras = numberOfCameras - vehicleCount;
    const extraCameraHours = extraCameras * 0.5; // 0.5 hours per additional camera
    installationHours += extraCameraHours;
  }
  
  // Removal costs if existing solution needs removal
  let removalHours = 0;
  let removalCost = 0;
  if (assessment.removalNeeded === 'yes' && assessment.removalVehicleCount) {
    removalHours = assessment.removalVehicleCount * 0.5; // 0.5 hours per vehicle for removal
    removalCost = Math.round(removalHours * HOURLY_RATE * 100) / 100;
  }
  
  // Add exactly 1 additional labor hold hour
  const laborHoldHours = 1;
  
  const surveyCost = Math.round(surveyHours * HOURLY_RATE * 100) / 100;
  const installationCost = Math.round(installationHours * HOURLY_RATE * 100) / 100;
  const laborHoldCost = Math.round(laborHoldHours * HOURLY_RATE * 100) / 100;
  const configurationCost = 0; // Included in service
  const trainingCost = 0; // Included in service
  const totalCost = Math.round((surveyCost + installationCost + removalCost + laborHoldCost) * 100) / 100;

  return {
    surveyCost,
    installationCost,
    configurationCost,
    trainingCost,
    hardwareCost: 0,
    removalCost: removalCost > 0 ? removalCost : undefined,
    totalCost,
    surveyHours,
    installationHours,
    configurationHours: 0,
    removalHours: removalHours > 0 ? removalHours : undefined,
    laborHoldHours,
    laborHoldCost,
    hourlyRate: HOURLY_RATE,
  };
}