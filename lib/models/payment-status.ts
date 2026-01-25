export enum PaymentStatus {
  PENDING = 'PENDING',         // Payment created, not started yet
  PROCESSING = 'PROCESSING',   // User redirected to PayPal / waiting for webhook
  PAID = 'PAID',               // Payment successfully captured and confirmed
  FAILED = 'FAILED',           // Payment failed or was denied by PayPal
  CANCELED = 'CANCELED',       // Payment canceled by the user
  EXPIRED = 'EXPIRED',         // Payment not completed within the allowed time
  REFUNDED = 'REFUNDED',       // Payment fully or partially refunded
}
