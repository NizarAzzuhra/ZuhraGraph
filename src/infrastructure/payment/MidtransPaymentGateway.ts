import { PaymentGateway, PaymentInitiationResult } from '../../domain/interfaces/PaymentGateway';
import midtransClient from 'midtrans-client';

export class MidtransPaymentGateway implements PaymentGateway {
  private snap: any;
  private coreApi: any;

  constructor() {
    const config = {
      isProduction: process.env.MIDTRANS_ENVIRONMENT === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY || 'dummy_server_key',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || 'dummy_client_key'
    };
    this.snap = new midtransClient.Snap(config);
    this.coreApi = new midtransClient.CoreApi(config);
  }

  public async initiatePayment(orderId: string, amount: number, buyerInfo: any, zuhraGraphOrderId: string): Promise<PaymentInitiationResult> {
    const isProduction = process.env.MIDTRANS_ENVIRONMENT === 'production';
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

    if (!baseUrl) {
      if (isProduction) {
        throw new Error('Configuration Error: NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be set in production environment.');
      } else {
        baseUrl = 'http://localhost:3000';
      }
    }

    // Ensure no trailing slash for cleaner URL building
    baseUrl = baseUrl.replace(/\/$/, '');
    const redirectCallbackUrl = `${baseUrl}/orders/${zuhraGraphOrderId}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: buyerInfo,
      callbacks: {
        finish: redirectCallbackUrl,
        unfinish: redirectCallbackUrl,
        error: redirectCallbackUrl
      }
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url
      };
    } catch (error) {
      console.error('Midtrans initiatePayment error:', error);
      throw new Error('Failed to initiate payment with Midtrans.');
    }
  }

  public verifyWebhookSignature(payload: any, signature: string): boolean {
    const crypto = require('crypto');
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'dummy_server_key';
    const hash = crypto
      .createHash('sha512')
      .update(payload.order_id + payload.status_code + payload.gross_amount + serverKey)
      .digest('hex');
    return hash === signature;
  }

  public async getPaymentStatus(transactionId: string): Promise<{ transaction_status: string, transaction_id: string, fraud_status?: string }> {
    try {
      const response = await this.snap.transaction.status(transactionId);
      return {
        transaction_status: response.transaction_status,
        transaction_id: response.transaction_id || transactionId, // Fallback to parameter just in case
        fraud_status: response.fraud_status
      };
    } catch (error: any) {
      console.error('Midtrans getPaymentStatus error:', error);
      if (error.httpStatusCode === 404 || error.httpStatusCode === '404' || (error.message && error.message.includes('404'))) {
        throw new Error('Midtrans_404');
      }
      throw new Error('Midtrans_Network_Error');
    }
  }

  public async refundPayment(transactionId: string, parameter: { refund_key?: string; amount?: number; reason?: string }): Promise<any> {
    const payload: any = {
      refund_key: parameter.refund_key || `refund-${Date.now()}`,
      reason: parameter.reason || 'Admin requested refund'
    };
    if (parameter.amount !== undefined && parameter.amount !== null) {
      payload.amount = parameter.amount;
    }
    return await this.coreApi.transaction.refund(transactionId, payload);
  }
}
