declare module 'midtrans-client' {
  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(parameter: any): Promise<any>;
    transaction: {
      status(transactionId: string): Promise<any>;
      cancel(transactionId: string): Promise<any>;
      approve(transactionId: string): Promise<any>;
      deny(transactionId: string): Promise<any>;
      expire(transactionId: string): Promise<any>;
      refund(transactionId: string, parameter?: any): Promise<any>;
      refundDirect(transactionId: string, parameter?: any): Promise<any>;
    };
  }

  export class CoreApi {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    charge(parameter: any): Promise<any>;
    capture(parameter: any): Promise<any>;
    transaction: {
      status(transactionId: string): Promise<any>;
      statusB2b(transactionId: string): Promise<any>;
      approve(transactionId: string): Promise<any>;
      deny(transactionId: string): Promise<any>;
      cancel(transactionId: string): Promise<any>;
      expire(transactionId: string): Promise<any>;
      refund(transactionId: string, parameter?: any): Promise<any>;
      refundDirect(transactionId: string, parameter?: any): Promise<any>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
    [key: string]: any;
  };

  export default midtransClient;
}
