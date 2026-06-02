import { ValidationPack } from './types';

export const VALIDATION_PACKS: ValidationPack[] = [
  {
    id: 'payments',
    name: 'Payment Validation Pack',
    category: 'Payments',
    description: 'Validates authorization requests, billing adjustments, processor declines, settlement ledger integrity, and downstream event blocks.',
    requiredFields: ['transactionId', 'orderId', 'environment', 'uiObservedResult'],
    expectedChecks: [
      { system: 'Payment Processor Gateway', check: 'authorization_status', expected: 'DECLINED' },
      { system: 'Order Transaction Ledger', check: 'ledger_entry_created', expected: false },
      { system: 'Order Service', check: 'order_status', expected: 'PAYMENT_FAILED_OR_UNPAID' },
      { system: 'Fulfillment Dispatch Queue', check: 'delivery_job_triggered', expected: false },
      { system: 'Customer Notification Router', check: 'failure_email_sent', expected: true }
    ],
    sampleCases: [
      {
        title: 'Decline Mismatch Error (Severe Failure)',
        description: 'Simulates a transaction where the payment is declined by the processor, but a software defect allows the Order Service to still progress to warehouse dispatch.',
        inputs: {
          orderId: 'ORD-98211-PAY',
          transactionId: 'TXN-PAY-88219x',
          environment: 'QA',
          uiObservedResult: 'UI showed Payment Declined. Order cancellation error',
          timestamp: '2026-06-02T15:20:00Z'
        },
        simulateFail: true
      },
      {
        title: 'Successful Decline Handling (Normal PASS)',
        description: 'Simulates a payment decline where both UI and backend correctly synchronize to register the transaction as failed and suppress fulfillment.',
        inputs: {
          orderId: 'ORD-10928-DEC',
          transactionId: 'TXN-DEC-22319s',
          environment: 'Stage',
          uiObservedResult: 'UI correctly loaded Payment Failed screen. Order status updated.',
          timestamp: '2026-06-02T10:15:00Z'
        },
        simulateFail: false
      }
    ]
  },
  {
    id: 'order-cancellation',
    name: 'Order Cancellation Validation Pack',
    category: 'Fulfillment & Logistics',
    description: 'Ensures that cancelled orders safely halt delivery pipelines, reverse payment approvals, and trigger immediate inventory replenishment.',
    requiredFields: ['orderId', 'environment', 'uiObservedResult'],
    expectedChecks: [
      { system: 'Order Lifecycle Engine', check: 'order_final_status', expected: 'CANCELLED' },
      { system: 'Payment Gateway Broker', check: 'authorization_reversal', expected: 'REVERSED_OR_SUCCESS' },
      { system: 'Inventory Reservation DB', check: 'reservation_released', expected: true },
      { system: 'Warehouse Fulfillment API', check: 'shipment_manifest_created', expected: false },
      { system: 'Client Messaging Dispatch', check: 'cancellation_receipt_sent', expected: true }
    ],
    sampleCases: [
      {
        title: 'Fulfillment Leak (Fulfillment Event Created after Cancellation)',
        description: 'Simulates a race condition where the UI successful cancellation confirmation does not propagate to the warehouse queue, letting a canceled order ship.',
        inputs: {
          orderId: 'ORD-55410-CAN',
          environment: 'QA',
          uiObservedResult: 'Cancellation confirmation toast appeared. Status: cancelled',
          timestamp: '2026-06-02T16:02:40Z'
        },
        simulateFail: true
      },
      {
        title: 'Graceful Cancellation (Normal PASS)',
        description: 'Simulates a clean cancelled transaction pipeline where the reservation is returned to central stock and logistics cancel the shipment.',
        inputs: {
          orderId: 'ORD-33291-OK',
          environment: 'Stage',
          uiObservedResult: 'Order cancellation successfully completed.',
          timestamp: '2026-06-02T09:30:12Z'
        },
        simulateFail: false
      }
    ]
  },
  {
    id: 'inventory-reservation',
    name: 'Inventory & Stock Reservation Pack',
    category: 'Inventory',
    description: 'Inspects real-time inventory adjustments, negative stock avoidance safeguards, click-to-collect task generation, and event synchronizations.',
    requiredFields: ['orderId', 'environment', 'uiObservedResult'],
    expectedChecks: [
      { system: 'Global Stock Matrix', check: 'allocated_shares_counted', expected: 'DEDUCTED' },
      { system: 'Local Store Reserve DB', check: 'negative_stock_limit_breached', expected: false },
      { system: 'Fulfillment Task Broker', check: 'pickup_job_ticket_loaded', expected: true },
      { system: 'Enterprise ERP Event Publisher', check: 'inventory_sync_event_published', expected: true }
    ],
    sampleCases: [
      {
        title: 'Allocation Event Failure (Warning/Leak)',
        description: 'Simulates a stock reservation where the store reserves physical stock, but the master ERP broadcast fails, risking overselling of popular SKUs.',
        inputs: {
          orderId: 'ORD-41229-INV',
          environment: 'QA',
          uiObservedResult: 'UI was successful. Pickup instructions displayed.',
          timestamp: '2026-06-02T11:45:00Z'
        },
        simulateFail: true
      }
    ]
  },
  {
    id: 'promotions-pricing',
    name: 'Promo Engine & Price Validation Pack',
    category: 'Pricing',
    description: 'Validates loyalty coupon applications, cart-level vs invoice-level tax and discount compliance, and pricing audit trail logs.',
    requiredFields: ['orderId', 'environment', 'uiObservedResult'],
    expectedChecks: [
      { system: 'Promotions Evaluation Service', check: 'coupon_code_approved', expected: true },
      { system: 'Retail Checkout Ledger', check: 'order_invoice_discount_matches', expected: true },
      { system: 'Tax Calculator Engine', check: 'recalculated_tax_value_correct', expected: true },
      { system: 'Audit Log Archiver', check: 'coupon_usage_history_logged', expected: true }
    ],
    sampleCases: [
      {
        title: 'Invoice Discount Mismatch (Calculated Leak)',
        description: 'Simulates a defect where the coupon successfully applies to the cart subtotal, but is completely lost in the final invoice ledger recalculation under specific payment speeds.',
        inputs: {
          orderId: 'ORD-72551-PRM',
          environment: 'QA',
          uiObservedResult: '$10.00 coupon discount displayed correctly at payments step.',
          timestamp: '2026-06-02T14:10:22Z'
        },
        simulateFail: true
      }
    ]
  },
  {
    id: 'returns-refunds',
    name: 'Returns & Refund Ledger Pack',
    category: 'Finance & Accounts',
    description: 'Tracks return authorizations, financial adjustments, processor refund credits, and re-stock inventory ledger postings.',
    requiredFields: ['orderId', 'environment', 'uiObservedResult'],
    expectedChecks: [
      { system: 'Returns Workflow Orchestrator', check: 'active_return_ticket_valid', expected: true },
      { system: 'Payment Processor Client', check: 'credits_submitted_to_gateway', expected: true },
      { system: 'Corporate Ledger System', check: 'financial_book_adjusted', expected: true },
      { system: 'Stock Replenishment Queue', check: 'restock_item_ledger_updated', expected: true }
    ],
    sampleCases: [
      {
        title: 'Stuck Refund Credit Gateway Timeout',
        description: 'Simulates a failure where the refund is booked and shown as successful, but the actual gateway processor call times out silently without log alerts.',
        inputs: {
          orderId: 'ORD-54899-REF',
          environment: 'Stage',
          uiObservedResult: 'Refund successful message and receipt emailed.',
          timestamp: '2026-06-02T08:00:15Z'
        },
        simulateFail: true
      }
    ]
  },
  {
    id: 'notifications',
    name: 'Customer Notification Loop Pack',
    category: 'Marketing & CRM',
    description: 'Analyzes digital channel deliveries, template resolution variables, latency validation SLA checks, and user communication spam blocks.',
    requiredFields: ['orderId', 'environment', 'uiObservedResult'],
    expectedChecks: [
      { system: 'Notification Event Trigger', check: 'template_variables_resolved', expected: true },
      { system: 'SMTP SendGrid Service', check: 'email_delivery_completed', expected: true },
      { system: 'SMS Gateway Client', check: 'sms_push_status_ok', expected: true },
      { system: 'CRM Privacy Vault', check: 'channel_consent_override_checked', expected: true }
    ],
    sampleCases: [
      {
        title: 'Communication Broadcast Dropout',
        description: 'Simulates validation of transaction confirmation mails where the alert service gets triggered, but a silent downstream DNS crash drops the event.',
        inputs: {
          orderId: 'ORD-90219-NTF',
          environment: 'QA',
          uiObservedResult: 'Transaction completed. Email receipt pending.',
          timestamp: '2026-06-02T13:40:55Z'
        },
        simulateFail: true
      }
    ]
  }
];
