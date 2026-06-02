import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { VALIDATION_PACKS } from './src/validationPacks';
import { TestValidationResponse, ProductionImpactResult, ResultStatus, SystemLog, BugDraft } from './src/types';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-system trace utility
function generateTraceId(): string {
  return 'TRC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Global Gemini setup with telemetry headers
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log('Gemini AI SDK client initialized successfully.');
    } else {
      console.warn('GEMINI_API_KEY environment variable is not defined - using robust simulated analytical fallback');
    }
  }
  return aiClient;
}

// 1. API: List validation packs
app.get('/api/validation-packs', (req, res) => {
  res.json(VALIDATION_PACKS);
});

// 2. API: Evaluate and validate test execution (Engine 1)
app.post('/api/validate-test', async (req, res) => {
  try {
    const {
      validationPackId,
      orderId = 'N/A',
      transactionId = 'N/A',
      environment = 'QA',
      uiObservedResult = '',
      timestamp = new Date().toISOString(),
      simulateFail = false,
      customLogs = ''
    } = req.body;

    const pack = VALIDATION_PACKS.find(p => p.id === validationPackId);
    if (!pack) {
      return res.status(404).json({ error: `Validation Pack '${validationPackId}' not found.` });
    }

    const traceId = generateTraceId();
    const testDate = new Date(timestamp);
    const traceTime = (offsetSec: number) => new Date(testDate.getTime() + offsetSec * 1000).toISOString();

    // Determine target state and status
    let status: ResultStatus = 'PASS';
    if (simulateFail) {
      status = 'FAIL';
    } else if (uiObservedResult.toLowerCase().includes('fail') || uiObservedResult.toLowerCase().includes('error') || uiObservedResult.toLowerCase().includes('pending')) {
      status = 'WARNING';
    }

    // Build expectations checks list
    const actualChecks = pack.expectedChecks.map((chk) => {
      let actualVal: string | boolean = chk.expected;
      let checkStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';

      if (simulateFail) {
        // If simulated fail, we leak or fail specific outcomes based on the pack
        if (pack.id === 'payments' && chk.check === 'delivery_job_triggered') {
          actualVal = true; // PAYMENT FAILURE LEAKED: started dispatch!
          checkStatus = 'FAIL';
        } else if (pack.id === 'order-cancellation' && chk.check === 'shipment_manifest_created') {
          actualVal = true; // CANCELLED ORDER SHIPPED: created dispatch event!
          checkStatus = 'FAIL';
        } else if (pack.id === 'inventory-reservation' && chk.check === 'inventory_sync_event_published') {
          actualVal = false; // INVENTORY DISPATCH SYNC ERROR: CRM alert dropped
          checkStatus = 'WARNING';
        } else if (pack.id === 'promotions-pricing' && chk.check === 'order_invoice_discount_matches') {
          actualVal = false; // DISCOUNT ENGINE INVOICE SLIP
          checkStatus = 'FAIL';
        } else if (pack.id === 'returns-refunds' && chk.check === 'credits_submitted_to_gateway') {
          actualVal = false; // REFUND PROCESSOR RETRY OUTAGE
          checkStatus = 'FAIL';
        } else if (pack.id === 'notifications' && chk.check === 'email_delivery_completed') {
          actualVal = false; // SMTP OUTAGE
          checkStatus = 'WARNING';
        } else {
          // General offset
          if (typeof chk.expected === 'boolean') {
            actualVal = !chk.expected;
            checkStatus = 'FAIL';
          } else {
            actualVal = 'UNEXPECTED_STATE_MISMATCH';
            checkStatus = 'FAIL';
          }
        }
      }
      return {
        ...chk,
        actual: actualVal,
        status: checkStatus
      };
    });

    // Detect general status aggregated
    const hasFailCheck = actualChecks.some(c => c.status === 'FAIL');
    const hasWarnCheck = actualChecks.some(c => c.status === 'WARNING');
    if (hasFailCheck) {
      status = 'FAIL';
    } else if (hasWarnCheck && status !== 'FAIL') {
      status = 'WARNING';
    }

    // Generate correlated multi-system log streams
    const baseLogs: SystemLog[] = [
      { timestamp: traceTime(-5), service: 'API Gateway Ingress', level: 'info', message: `Incoming connection identified. Service: Client Web checkout application. Route: /v2/orders/receipt. TraceId: ${traceId}` },
      { timestamp: traceTime(-4), service: 'Authentication Broker', level: 'info', message: `Token validation passed for principal_id: usr_qa_tester_01. Authorization: [ROLE_QA_AUTOMATION].` }
    ];

    if (pack.id === 'payments') {
      baseLogs.push(
        { timestamp: traceTime(-3), service: 'Order Placement API', level: 'info', message: `Processed request. Order UUID: ${orderId}. State: NEW. Queueing to Payment router.` },
        { timestamp: traceTime(-2), service: 'Payment Processor Gateway', level: simulateFail ? 'error' : 'info', message: simulateFail ? `[CRITICAL_FAIL] Authorization declined. Gateway response: REJECTED_BY_FRAUD_SHIELD. Transaction ID: ${transactionId}. RetryCount: 0.` : `Transaction APPROVED successfully. Receipt: ${transactionId}. Response: 00.` },
        { timestamp: traceTime(-1), service: 'Order Transaction Ledger', level: 'info', message: simulateFail ? `Transaction failed recording on ledger. State flagged: UNPAID_CANCEL_JOB. No credit generated.` : `Ledger updated. Added double-entry Debit block. Total amount recorded matches Order total.` }
      );
      if (simulateFail) {
        baseLogs.push(
          { timestamp: traceTime(1), service: 'Order Service', level: 'warn', message: `[RACE_CONDITION] Status mismatch: Payment failed, but order-event pipeline published state as APPROVED_FOR_DELIVERY` },
          { timestamp: traceTime(2), service: 'Fulfillment Dispatch Queue', level: 'error', message: `[LEAK] Dispatched warehouse manifest to routing terminal! Delivery job triggered for Order: ${orderId} despite active payment failure flag!` },
          { timestamp: traceTime(3), service: 'Customer Notification Router', level: 'warn', message: `Emailed notice template [PAYMENT_RE_AUTHLIMIT] to customer regarding billing failure.` }
        );
      } else {
        baseLogs.push(
          { timestamp: traceTime(1), service: 'Order Service', level: 'info', message: `OrderStatus updated to [PAYMENT_FAILED]. Fulfillment pipeline aborted. No dispatch triggered.` },
          { timestamp: traceTime(2), service: 'Customer Notification Router', level: 'info', message: `Emailed notice [TRANSACTION_DECLINED_RETRY] to customer.` }
        );
      }
    } else if (pack.id === 'order-cancellation') {
      baseLogs.push(
        { timestamp: traceTime(-3), service: 'Order Lifecycle Engine', level: 'info', message: `Cancellation requested for active order: ${orderId}. Current state: PENDING_DISPATCH.` },
        { timestamp: traceTime(-2), service: 'Payment Gateway Broker', level: 'info', message: `Sent reversal call to processor. Status received: VOIDED_SUCCESS.` },
        { timestamp: traceTime(-1), service: 'Inventory Reservation DB', level: 'info', message: `Replenished reservation count for items in Order: ${orderId}. Global inventory catalog updated.` }
      );
      if (simulateFail) {
        baseLogs.push(
          { timestamp: traceTime(1), service: 'Warehouse Fulfillment API', level: 'error', message: `[LOGISTICS_LEAK] Fulfillment dispatch was already locked by terminal thread. Canceled event received too late. Shipments docket created! Courier queued.` },
          { timestamp: traceTime(2), service: 'Client Messaging Dispatch', level: 'info', message: `Dispatched Event [CANCELLATION_RECEIPT] confirming complete cancel to customer.` }
        );
      } else {
        baseLogs.push(
          { timestamp: traceTime(1), service: 'Warehouse Fulfillment API', level: 'info', message: `Successfully locked shipment docket. Released dispatch tasks. Status: CR_HALTED.` },
          { timestamp: traceTime(2), service: 'Client Messaging Dispatch', level: 'info', message: `Dispatched Event [CANCELLATION_RECEIPT] confirming complete cancel to customer.` }
        );
      }
    } else if (pack.id === 'inventory-reservation') {
      baseLogs.push(
        { timestamp: traceTime(-3), service: 'Global Stock Matrix', level: 'info', message: `Querying available allocations. Order: ${orderId}. Deducted 1 SKU from store shelf reservations.` },
        { timestamp: traceTime(-2), service: 'Local Store Reserve DB', level: 'info', message: `Reserved 1 unit. Local balance level: positive. Minimum reserve caps not breached.` },
        { timestamp: traceTime(-1), service: 'Fulfillment Task Broker', level: 'info', message: `Generated pickup job ID: PICK-${Math.floor(Math.random() * 90000 + 10000)}. Status: SUBMITTED.` }
      );
      if (simulateFail) {
        baseLogs.push(
          { timestamp: traceTime(1), service: 'Enterprise ERP Event Publisher', level: 'error', message: `[CRITICAL_BROWSING_TIMED_OUT] Failed to broadcast inventory deductions event to ERP cluster after 3 attempts. State is inconsistent. Remote ledger unsynced.` }
        );
      } else {
        baseLogs.push(
          { timestamp: traceTime(1), service: 'Enterprise ERP Event Publisher', level: 'info', message: `Broadcasted event sync_event_allocated. Remote clusters synchronized successfully.` }
        );
      }
    } else {
      // General fallbacks
      baseLogs.push(
        { timestamp: traceTime(-3), service: 'Business Rules Evaluator', level: 'info', message: `Evaluation began for pack: ${pack.name}. Inputs verified.` },
        { timestamp: traceTime(-1), service: 'Storage Core View', level: simulateFail ? 'error' : 'info', message: simulateFail ? `Audit error registered during state assertions. Check discrepancies.` : `State assertion test sequence cleared.` }
      );
    }

    // Append custom logs if the user has inputted them
    if (customLogs && customLogs.trim() !== '') {
      baseLogs.push({
        timestamp: new Date().toISOString(),
        service: 'Manual Paste Evidence',
        level: 'warn',
        message: `User-provided context log asserts: ${customLogs}`
      });
    }

    // Agent checklist / Steps executed
    const agentSteps = [
      `Initialized Agent: Copilot Studio QA Companion`,
      `Decoded payload schema verification parameters. Target Environment: [${environment}]`,
      `Matched test context with Domain Category: [${pack.category}]`,
      `Retrieved validation rule contract specifications for pack (Selection ID: ${pack.id})`,
      `Executed secure sandbox MCP Tool: validate_test_execution(traceId: "${traceId}")`,
      `Executed MCP Log Correlation Tool: fetch_correlated_logs(orderId: "${orderId}", traceId: "${traceId}")`,
      `Compared expected validation attributes with retrieved state snapshots...`
    ];

    // Dynamic AI Analysis
    let analysisText = '';
    let riskText = '';
    let actionText = '';

    const gemini = getGemini();
    if (gemini) {
      try {
        const prompt = `
You are the QA Accelerator AI engine, an expert system-aware Quality intelligence orchestrator.
Analyse the following test validation execution parameters:
- Domain Pack: ${pack.name} (${pack.category})
- Environment: ${environment}
- Status Claimed: ${status}
- Identified System Assertions states: ${JSON.stringify(actualChecks)}
- Transaction Logs: ${JSON.stringify(baseLogs)}

Please generate three outputs in clean paragraphs:
1. "Analysis Explanation": Explain exactly what was detected on the backend. Contrast what the user observed in the UI versus what truly occurred in the backend logs/traces (mentioning specific systems). Keep it professional, objective, and analytical.
2. "Risk Analysis": Highlight the downstream/business impacts of this failure pattern (e.g., financial leakage, shipment duplication, stock level discrepancies, compliance risks).
3. "Suggested Actions": State whether the QA Engineer should immediately fail the run, trigger a triage ticket, or perform extra check-points.

Keep your response structured but return as a simple markdown text. Use headings "### Explanation", "### Business Risk", and "### Action".
`;
        const resAi = await gemini.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        const textOutput = resAi.text || '';
        analysisText = textOutput;
      } catch (err) {
        console.error('Gemini content generation failed, resorting to rule-based fallback analysis', err);
      }
    }

    // Heuristic analysis if Gemini is missing or failed
    if (!analysisText) {
      if (status === 'PASS') {
        analysisText = `### Explanation\nBackend state matches transaction assertions perfectly. The UI observation is fully synchronized with correct database allocations and network transmissions. Trace references resolve cleanly.`;
        riskText = `### Business Risk\nZero. Operation conforms to standard business rule frameworks. Zero escaping risk detected.`;
        actionText = `### Action\nApprove test execution run inside TestRail / Zephyr. Include evidence snapshot transaction block: ${traceId}.`;
      } else if (status === 'WARNING') {
        analysisText = `### Explanation\nThe business workflow was successfully completed, but secondary non-blocking events failed or exceeded the expected latency bounds. This indicates a minor thread congestion or an API gateway timeout in the notification layer.`;
        riskText = `### Business Risk\nLow customer or financial leakage risk. However, prolonged alerts queuing may lead to customer call-center inquiries regarding delayed confirmations.`;
        actionText = `### Action\nLog a performance issue draft. Flag to DevOps for monitoring micro-service resource allocations. Mark test as completed with WARNING constraints.`;
      } else {
        analysisText = `### Explanation\nCritical backend state drift detected! While the checkout UI reported status correctly (or with controlled generic alert notifications), backend logs show a severe leak where the fulfillment dispatch API compiled shipment manifests for order "${orderId}" anyway. There is a race condition or a missing authorization block check in the Kafka event scheduler.`;
        riskText = `### Business Risk\nSevere financial leakage and operational confusion! Canceled orders will be packed, loaded onto trucks, and routed to logistics networks, leading to lost double-shipping inventory costs, processing fees, and complex manual financial chargebacks.`;
        actionText = `### Action\nFail the test execution run immediately. Collect the trace payload and logs, and invoke the **QA Bug Triage & Production Impact Analyzer** to draft an emergency triage defect.`;
      }
    }

    const responseData: TestValidationResponse = {
      status,
      validationPackId: pack.id,
      validationPackName: pack.name,
      testCaseDetails: {
        title: simulateFail ? `Failure Case Scenario Simulation: ${pack.sampleCases[0]?.title || 'Custom Fail'}` : `Assertive Operations Validation: ${pack.name}`,
        inputs: {
          'Order ID': orderId,
          'Transaction ID': transactionId,
          'Environment Scope': environment,
          'Timestamp Event': timestamp,
          'UI Observed Result': uiObservedResult,
          'Process Trace ID': traceId
        }
      },
      checks: actualChecks,
      logs: baseLogs,
      agentSteps,
      analysis: analysisText,
      riskSummary: riskText,
      suggestedAction: actionText
    };

    res.json(responseData);

  } catch (error: any) {
    console.error('Error validating test case:', error);
    res.status(500).json({ error: error.message || 'Internal server error during validation execution.' });
  }
});

// 3. API: Analyze production impact and triage defect (Engine 2)
app.post('/api/analyze-defect', async (req, res) => {
  try {
    const {
      title = '',
      summary = '',
      stepsToReproduce = '',
      expectedBehavior = '',
      actualResult = '',
      evidenceLogs = [],
      // Slider/input controls from user's interactive scorecard
      volumeStoreCount = 5,
      financialTweakDollar = 500,
      customerFric = 'medium', // low, medium, high
      downstreamImpactedServices = 1
    } = req.body;

    // We can evaluate recommended severity and priority using deterministic scorecard + AI reasoning
    let financialScore = 1; // 1-3
    if (financialTweakDollar > 10000) financialScore = 3;
    else if (financialTweakDollar > 1500) financialScore = 2;

    let customerScore = 1; // 1-3
    if (customerFric === 'high') customerScore = 3;
    else if (customerFric === 'medium') customerScore = 2;

    let volumeScore = 1; // 1-3
    if (volumeStoreCount > 15) volumeScore = 3;
    else if (volumeStoreCount > 3) volumeScore = 2;

    let downstreamScore = 1; // 1-3
    if (downstreamImpactedServices > 2) downstreamScore = 3;
    else if (downstreamImpactedServices > 0) downstreamScore = 2;

    const totalWeight = financialScore * 0.35 + customerScore * 0.30 + volumeScore * 0.20 + downstreamScore * 0.15;

    let recommendedSeverity = 'Sev-3';
    let recommendedPriority = 'P3';
    let suggestedOwnerTeam = 'Platform Core';

    if (totalWeight >= 2.6) {
      recommendedSeverity = 'Sev-1';
      recommendedPriority = 'P1';
    } else if (totalWeight >= 1.8) {
      recommendedSeverity = 'Sev-2';
      recommendedPriority = 'P2';
    } else if (totalWeight >= 1.2) {
      recommendedSeverity = 'Sev-3';
      recommendedPriority = 'P3';
    } else {
      recommendedSeverity = 'Sev-4';
      recommendedPriority = 'P4';
    }

    // Route owner based on keywords
    const textContext = (title + ' ' + summary).toLowerCase();
    if (textContext.includes('pay') || textContext.includes('ledger') || textContext.includes('refund') || textContext.includes('credit')) {
      suggestedOwnerTeam = 'Payments Gateway Integration Team';
    } else if (textContext.includes('fulfillment') || textContext.includes('ship') || textContext.includes('warehouse') || textContext.includes('logistics')) {
      suggestedOwnerTeam = 'Logistics & Warehouse Delivery Team';
    } else if (textContext.includes('inventory') || textContext.includes('stock') || textContext.includes('quantity') || textContext.includes('sku')) {
      suggestedOwnerTeam = 'Central Inventory & Allocation System';
    } else if (textContext.includes('promotion') || textContext.includes('pricing') || textContext.includes('coupon') || textContext.includes('tax')) {
      suggestedOwnerTeam = 'Cart Promotions & Pricing Calc Service';
    } else if (textContext.includes('notification') || textContext.includes('mail') || textContext.includes('email') || textContext.includes('sms')) {
      suggestedOwnerTeam = 'Customer Communications Engine (CRM)';
    }

    // Similar incident patterns matching simulation
    let similarCount = Math.floor(Math.random() * 20 + 2);
    if (recommendedSeverity === 'Sev-1') similarCount = Math.floor(Math.random() * 45 + 25);
    else if (recommendedSeverity === 'Sev-2') similarCount = Math.floor(Math.random() * 25 + 10);

    const affectedOrders = Math.floor(similarCount * (2.4 + Math.random() * 3));

    let aiDraftTitle = title || `UNEXPECTED STATE DRIFT: ${suggestedOwnerTeam}`;
    let jiraSummaryMarkdown = '';
    let aiExplanationResult = '';

    const gemini = getGemini();
    if (gemini) {
      try {
        const prompt = `
You are the Bug Triage Specialist Agent of the QA Accelerator Platform.
Analyze the following bug ticket request context:
- Ticket Title: ${title}
- Background Summary: ${summary}
- Steps to Reproduce: ${stepsToReproduce}
- Expected Behavior: ${expectedBehavior}
- Actual Result Outlined: ${actualResult}
- Evidence Logs context: ${JSON.stringify(evidenceLogs)}
- Volume Store Count: ${volumeStoreCount} stores
- Estimated Financial Leakage: $${financialTweakDollar}
- Customer Friction Level: ${customerFric}

Please construct a comprehensive JSON object that conforms to the following schema:
{
  "bugTitle": "Short, powerful title highlighting system error",
  "jiraSummaryMarkdown": "Full rich Markdown formatted summary including: Summary description, reproducible steps, expected vs actual list, impact signals, and specific microservice ownership recommendation",
  "aiExplanationResult": "Analytical 2-sentence rationale explain exactly why this severity level (${recommendedSeverity}) is recommended based on retail operational risks, incident frequency matching, or compliance standards"
}

Make sure to output valid, parseable JSON only. Do not enclose the JSON inside markdown triple backticks.
`;
        const resAi = await gemini.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bugTitle: { type: Type.STRING },
                jiraSummaryMarkdown: { type: Type.STRING },
                aiExplanationResult: { type: Type.STRING }
              },
              required: ['bugTitle', 'jiraSummaryMarkdown', 'aiExplanationResult']
            }
          }
        });

        const jsonOutput = JSON.parse(resAi.text.trim());
        aiDraftTitle = jsonOutput.bugTitle;
        jiraSummaryMarkdown = jsonOutput.jiraSummaryMarkdown;
        aiExplanationResult = jsonOutput.aiExplanationResult;
      } catch (err) {
        console.error('Gemini defect analysis failed, falling back to local text generator', err);
      }
    }

    if (!jiraSummaryMarkdown) {
      // Offline fallback text generator
      aiDraftTitle = title || `[DEFECT] Downstream Mismatch detected under ${suggestedOwnerTeam}`;
      jiraSummaryMarkdown = `h1. ${aiDraftTitle}

h2. Defect Description
A serious state validation failure has been detected by the *QA Accelerator Platform* during manual/automated test assertion verification. 

h2. Environmental Snapshot
* *Environment Scope:* QA / Stage Mocking
* *Identified Domain Owner:* ${suggestedOwnerTeam}
* *Estimated Outage Store Factor:* ${volumeStoreCount} retail outlets
* *Estimated Business Leakage per 30 Days:* $${financialTweakDollar} 

h2. Steps to Reproduce
${stepsToReproduce || '1. Place order with transaction ID.\n2. Force transaction cancel or decline.\n3. Validate downstream dispatcher logs.'}

h2. Expected vs Actual Assertions
* *Expected System Behavior:* ${expectedBehavior || 'System stops subsequent logs dispatch and updates internal state registers to failure.'}
* *Actual Result State:* ${actualResult || 'Log tracking shows processing succeeded anyway. Event broadcast triggers logistics shipping manifestations.'}

h2. Collected Evidence Sandbox Logs
{code:JSON}
${JSON.stringify(evidenceLogs.slice(0, 5), null, 2)}
{code}

h3. AI-Platform Quality Rationale
Recommended priority level assigned dynamically for ${suggestedOwnerTeam} queues because of significant customer impact risk factors.`;

      aiExplanationResult = `Severity ${recommendedSeverity} belongs to total weight score of ${totalWeight.toFixed(2)}. The error reflects potential inventory/financial system mismatch across ${volumeStoreCount} stores with no quick customer workarounds on active checkout devices.`;
    }

    const triageReport: ProductionImpactResult = {
      similarCount30Days: similarCount,
      affectedStores: volumeStoreCount,
      affectedOrders: affectedOrders,
      financialImpactEstimate: financialTweakDollar,
      customerImpactDescription: customerFric === 'high' ? 'Complete execution outage. Customer pays but gains no order receipt, or receives immediate delivery duplicate cancellations.' : 'Confusing layout UI notifications, slow checkout processing, or delay in notification mail templates.',
      operationalImpactDescription: `Logistics terminals overloaded with cancelled tracking queues. Manual audits required at checkout register hubs.`,
      productionLikelihood: volumeStoreCount > 10 ? 'HIGH' : volumeStoreCount > 3 ? 'MEDIUM' : 'LOW',
      confidenceScore: Math.floor(82 + Math.random() * 15),
      recommendedSeverity,
      recommendedPriority,
      suggestedOwnerTeam,
      scoringBreakdown: {
        financialScore,
        customerScore,
        volumeScore,
        downstreamScore,
        totalScore: Number(totalWeight.toFixed(2))
      }
    };

    const bugDraft: BugDraft = {
      title: aiDraftTitle,
      summary: jiraSummaryMarkdown,
      stepsToReproduce: stepsToReproduce || 'Execute standard test scenario parameters.',
      expectedBehavior: expectedBehavior || 'Transaction states align to business outcomes.',
      actualResult: actualResult || 'Logs evidence is inconsistent with UI expectations.',
      evidence: JSON.stringify(evidenceLogs, null, 2),
      suggestedOwner: suggestedOwnerTeam
    };

    res.json({
      triageReport,
      bugDraft,
      aiExplanationResult
    });

  } catch (error: any) {
    console.error('Error in defect analyzer triage API:', error);
    res.status(500).json({ error: error.message || 'Error processing AI QA Defect analysis.' });
  }
});


// Vite Dev Server Middleware or Static Production Build Configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server middleware mounted in Express.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Express serving static production content from /dist path.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QA Accelerator platform is up and running on port ${PORT}`);
  });
}

startServer();
