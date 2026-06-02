export type ResultStatus = 'PASS' | 'FAIL' | 'WARNING' | 'INCONCLUSIVE';

export interface ValidationPackCheck {
  system: string;
  check: string;
  expected: string | boolean;
  actual?: string | boolean;
  status: 'PASS' | 'FAIL' | 'WARNING';
}

export interface ValidationPack {
  id: string;
  name: string;
  category: string;
  description: string;
  requiredFields: string[];
  expectedChecks: { system: string; check: string; expected: string | boolean }[];
  sampleCases: {
    title: string;
    description: string;
    inputs: {
      orderId?: string;
      transactionId?: string;
      environment: string;
      uiObservedResult: string;
      timestamp: string;
    };
    simulateFail: boolean;
  }[];
}

export interface SystemLog {
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface TestValidationResponse {
  status: ResultStatus;
  validationPackId: string;
  validationPackName: string;
  testCaseDetails: {
    title: string;
    inputs: Record<string, string>;
  };
  checks: ValidationPackCheck[];
  logs: SystemLog[];
  agentSteps: string[];
  analysis: string;
  riskSummary: string;
  suggestedAction: string;
}

export interface ProductionImpactResult {
  similarCount30Days: number;
  affectedStores: number;
  affectedOrders: number;
  financialImpactEstimate: number;
  customerImpactDescription: string;
  operationalImpactDescription: string;
  productionLikelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  recommendedSeverity: string; // 'Sev-1' | 'Sev-2' | 'Sev-3' | 'Sev-4'
  recommendedPriority: string; // 'P1' | 'P2' | 'P3' | 'P4'
  suggestedOwnerTeam: string;
  scoringBreakdown: {
    financialScore: number;
    customerScore: number;
    volumeScore: number;
    downstreamScore: number;
    totalScore: number;
  };
}

export interface BugDraft {
  title: string;
  summary: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualResult: string;
  evidence: string;
  suggestedOwner: string;
}
