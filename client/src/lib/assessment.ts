import type { Assessment } from "@shared/schema";

export interface AssessmentStep {
  id: number;
  title: string;
  description: string;
  fields: (keyof Assessment)[];
}

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: 1,
    title: "Sales Executive Information",
    description: "Enter your organization and contact details",
    fields: ['salesExecutiveName', 'salesExecutiveEmail', 'salesExecutivePhone', 'organizationId'],
  },
  {
    id: 2,
    title: "Customer Information", 
    description: "Collect customer contact and site details",
    fields: ['customerCompanyName', 'customerContactName', 'customerEmail', 'customerPhone', 'siteAddress', 'industry', 'preferredInstallationDate'],
  },
  {
    id: 3,
    title: "Site Assessment",
    description: "Assess technical requirements and site characteristics",
    fields: ['buildingType', 'coverageArea', 'floors', 'deviceCount', 'routerCount', 'powerAvailable', 'ethernetRequired', 'ceilingMount', 'outdoorCoverage', 'interferenceSources', 'specialRequirements'],
  },
  {
    id: 4,
    title: "File Upload",
    description: "Upload site photos and supporting documents",
    fields: [],
  },
  {
    id: 5,
    title: "Quote Generation",
    description: "Review assessment and generate quote",
    fields: ['additionalNotes'],
  },
];

export function validateStep(step: number, data: Partial<Assessment>): boolean {
  const stepConfig = ASSESSMENT_STEPS.find(s => s.id === step);
  if (!stepConfig) return false;

  // Check required fields for the step
  const requiredFields = getRequiredFieldsForStep(step);
  return requiredFields.every(field => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });
}

export function getRequiredFieldsForStep(step: number): (keyof Assessment)[] {
  switch (step) {
    case 1:
      return ['salesExecutiveName', 'salesExecutiveEmail'];
    case 2:
      return ['customerCompanyName', 'customerContactName', 'customerEmail', 'siteAddress'];
    case 3:
      return ['buildingType', 'coverageArea'];
    default:
      return [];
  }
}

export function getStepProgress(currentStep: number, totalSteps: number): number {
  return Math.round((currentStep / totalSteps) * 100);
}
