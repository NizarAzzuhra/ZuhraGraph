import { RevisionRequest, RevisionClassification } from '../../domain/entities/RevisionRequest';
import { RevisionRequestRepository } from '../../domain/interfaces/RevisionRequestRepository';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { NotificationService } from '../../domain/interfaces/NotificationService';
import { Payment } from '../../domain/entities/Payment';
import { prisma } from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export class RevisionService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly revisionRequestRepository: RevisionRequestRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationService: NotificationService
  ) {}

  public async requestRevision(
    buyerId: string,
    orderId: string,
    description: string,
    artworkVersionId: string
  ): Promise<RevisionRequest> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pesanan tidak ditemukan');
    }

    if (order.buyerId !== buyerId) {
      throw new Error('Anda tidak memiliki akses ke pesanan ini.');
    }

    if (order.getStatus() !== 'WAITING_BUYER_CONFIRMATION') {
      throw new Error('Pesanan harus dalam status WAITING_BUYER_CONFIRMATION untuk mengajukan revisi.');
    }

    // Check if there is already a pending revision request
    const pendingRequest = await this.revisionRequestRepository.findPendingByOrderId(orderId);
    if (pendingRequest) {
      throw new Error('Sudah ada permintaan revisi yang sedang menunggu persetujuan.');
    }

    // Determine current revision request list to count previous revisions
    const allRequests = await this.revisionRequestRepository.findAllByOrderId(orderId);
    const revisionCount = allRequests.length + 1;

    const request = new RevisionRequest(
      uuidv4(),
      orderId,
      revisionCount,
      description,
      'PENDING',
      0,
      null,
      'BUYER',
      null,
      artworkVersionId,
      new Date(),
      new Date()
    );

    order.requestRevision();
    await this.orderRepository.save(order);
    await this.revisionRequestRepository.save(request);

    await this.notificationService.sendNotification(
      order.buyerId,
      'SYSTEM',
      `Permintaan revisi baru untuk pesanan ${order.id} telah diajukan.`
    );

    return request;
  }

  public async decideRevision(
    requestId: string,
    approve: boolean,
    decisionData: { classification: RevisionClassification; extraFee: number; reason?: string }
  ): Promise<{ request: RevisionRequest; paymentInfo?: { token: string; redirectUrl: string } }> {
    const request = await this.revisionRequestRepository.findById(requestId);
    if (!request) {
      throw new Error('Permintaan revisi tidak ditemukan');
    }

    if (request.getStatus() !== 'PENDING') {
      throw new Error('Keputusan hanya dapat dibuat untuk permintaan berstatus PENDING.');
    }

    const order = await this.orderRepository.findById(request.orderId);
    if (!order) {
      throw new Error('Pesanan terkait tidak ditemukan');
    }

    if (approve) {
      const { classification, extraFee, reason } = decisionData;
      
      // APPROVED
      const revisionCount = classification === 'REVISION' ? 1 : 0;
      request.approve(classification, extraFee, revisionCount, reason);
      await this.revisionRequestRepository.save(request);

      let paymentInfo: { token: string; redirectUrl: string } | undefined;

      if (extraFee > 0) {
        // Create payment entity
        const payment = new Payment(uuidv4(), order.id, extraFee, 'PENDING', null);
        
        // Find buyer info to pay
        const buyer = await prisma.user.findUnique({
          where: { id: order.buyerId }
        });
        
        const buyerInfo = {
          first_name: buyer?.name || "Buyer",
          email: buyer?.email || "buyer@example.com",
        };

        // Initiate Midtrans transaction
        const initResult = await this.paymentGateway.initiatePayment(order.id, extraFee, buyerInfo);
        payment.setToken(initResult.token);
        await this.paymentRepository.save(payment);
        
        paymentInfo = initResult;
      }

      await this.notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Permintaan revisi Anda untuk pesanan ${order.id} telah DISETUJUI sebagai ${classification}. ${extraFee > 0 ? `Biaya tambahan: Rp ${extraFee.toLocaleString('id-ID')}` : ''}`
      );

      return { request, paymentInfo };
    } else {
      const { reason } = decisionData;
      if (!reason || !reason.trim()) {
        throw new Error('Alasan penolakan wajib diisi.');
      }
      
      request.reject(reason);
      order.revertToWaitingBuyerConfirmation();
      
      await this.orderRepository.save(order);
      await this.revisionRequestRepository.save(request);

      await this.notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Permintaan revisi Anda untuk pesanan ${order.id} telah DITOLAK. Alasan: ${reason}`
      );

      return { request };
    }
  }

  public async startRevision(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pesanan tidak ditemukan');
    }

    if (order.getStatus() !== 'REVISION_REQUESTED') {
      throw new Error('Pesanan tidak dalam status meminta revisi.');
    }

    // Check if there are any approved revision requests with unpaid fees
    const requests = await this.revisionRequestRepository.findAllByOrderId(orderId);
    const approvedWithFee = requests.filter(r => r.getStatus() === 'APPROVED' && r.extraFee > 0);
    
    if (approvedWithFee.length > 0) {
      // Find payments for this order
      const payments = await this.paymentRepository.findByOrderId(orderId);
      // Wait, repository findByOrderId returns Payment | null (latest). We need all payments or can check via prisma
      // Let's check via prisma directly to be safe and accurate:
      const allPayments = await prisma.payment.findMany({
        where: { orderId }
      });
      
      const totalApprovedFee = approvedWithFee.reduce((sum, r) => sum + r.extraFee, 0);
      const successfulPaymentsTotal = allPayments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount.toNumber(), 0);

      // The original order amount is excluded from successfulPaymentsTotal
      const originalAmount = order.totalAmount;
      const extraPaid = Math.max(0, successfulPaymentsTotal - originalAmount);

      if (extraPaid < totalApprovedFee) {
        throw new Error('Pembayaran biaya tambahan untuk revisi belum selesai.');
      }
    }

    order.startRevision();
    await this.orderRepository.save(order);
  }
}
