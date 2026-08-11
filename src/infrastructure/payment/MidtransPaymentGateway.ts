import { PaymentGateway, PaymentInitiationResult } from '../../domain/interfaces/PaymentGateway';
import midtransClient from 'midtrans-client';

export class MidtransPaymentGateway implements PaymentGateway {
  private snap: any;

  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_ENVIRONMENT === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY || 'dummy_server_key',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || 'dummy_client_key'
    });
  }

  public async initiatePayment(orderId: string, amount: number, buyerInfo: any): Promise<PaymentInitiationResult> {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: buyerInfo
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

  public async getPaymentStatus(transactionId: string): Promise<string> {
    try {
      const response = await this.snap.transaction.status(transactionId);
      return response.transaction_status;
    } catch (error) {
      console.error('Midtrans getPaymentStatus error:', error);
      throw new Error('Failed to get payment status from Midtrans.');
    }
  }
}
