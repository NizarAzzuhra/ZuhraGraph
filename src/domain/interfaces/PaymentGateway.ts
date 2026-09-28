export interface PaymentInitiationResult {
  token: string;
  redirectUrl: string;
}

export interface PaymentGateway {
  initiatePayment(orderId: string, amount: number, buyerInfo: any, zuhraGraphOrderId: string): Promise<PaymentInitiationResult>;
  verifyWebhookSignature(payload: any, signature: string): boolean;
  getPaymentStatus(transactionId: string): Promise<{ transaction_status: string, transaction_id: string, fraud_status?: string }>;
  refundPayment?(transactionId: string, parameter: { refund_key?: string; amount?: number; reason?: string }): Promise<any>;
}
