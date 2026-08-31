import { RevisionRequest, RevisionClassification } from '../../domain/entities/RevisionRequest';
import { RevisionRequestRepository } from '../../domain/interfaces/RevisionRequestRepository';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { NotificationService } from '../../domain/interfaces/NotificationService';
import { prisma } from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { Payment } from '../../domain/entities/Payment';

export class RevisionService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly revisionRequestRepository: RevisionRequestRepository,
    private readonly notificationService: NotificationService,
    private readonly paymentRepository?: PaymentRepository,
    private readonly paymentGateway?: PaymentGateway
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

    const pendingRequest = await this.revisionRequestRepository.findPendingByOrderId(orderId);
    if (pendingRequest) {
      throw new Error('Sudah ada permintaan revisi yang sedang menunggu persetujuan.');
    }

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
    if (this.notificationService.sendToAdmins) {
      await this.notificationService.sendToAdmins('REVISION_REQUESTED', `Permintaan revisi baru diajukan untuk Pesanan #${order.id}`, `/admin/orders/${order.id}`);
    }

    return request;
  }

  public async decideRevision(
    requestId: string,
    approve: boolean,
    decisionData: { classification: RevisionClassification; extraFee: number; reason?: string }
  ): Promise<{ request: RevisionRequest }> {
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
      
      const revisionCount = classification === 'MINOR_REVISION' ? 1 : 0;
      request.approve(classification, extraFee, revisionCount, reason);
      await this.revisionRequestRepository.save(request);

      if (extraFee > 0) {
        await this.notificationService.sendNotification(
          order.buyerId,
          'SYSTEM',
          `Permintaan revisi Anda untuk pesanan ${order.id} membutuhkan BIAYA TAMBAHAN sebesar Rp ${extraFee.toLocaleString('id-ID')}. Silakan periksa detail pesanan Anda.`
        );
      } else {
        await this.notificationService.sendNotification(
          order.buyerId,
          'SYSTEM',
          `Permintaan revisi Anda untuk pesanan ${order.id} telah DISETUJUI secara GRATIS.`
        );
      }

      return { request };
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

  public async respondToPaidRevision(requestId: string, buyerId: string, accept: boolean, buyerInfo?: any): Promise<{ request: RevisionRequest; paymentToken?: string }> {
    const request = await this.revisionRequestRepository.findById(requestId);
    if (!request) {
      throw new Error('Permintaan revisi tidak ditemukan');
    }

    if (request.getStatus() !== 'REQUIRES_PAYMENT') {
      throw new Error('Permintaan revisi tidak memerlukan persetujuan pembayaran.');
    }

    const order = await this.orderRepository.findById(request.orderId);
    if (!order || order.buyerId !== buyerId) {
      throw new Error('Akses ditolak.');
    }

    if (accept) {
      // Set buyer decision to ACCEPTED but keep status as REQUIRES_PAYMENT until paid
      request.buyerDecision = 'ACCEPTED';
      await this.revisionRequestRepository.save(request);
      
      let token: string | undefined;

      if (this.paymentRepository && this.paymentGateway) {
        // Find if payment already initiated
        let payment = await this.paymentRepository.findByOrderId(order.id);
        
        // Ensure payment corresponds to this extraFee and is PENDING
        if (!payment || payment.amount !== request.extraFee || payment.getStatus() !== 'PENDING') {
          payment = new Payment(uuidv4(), order.id, request.extraFee, 'PENDING', null);
          await this.paymentRepository.save(payment);
        }

        if (payment.getToken()) {
          token = payment.getToken()!;
        } else {
          try {
            const paymentInfo = await this.paymentGateway.initiatePayment(payment.id, request.extraFee, buyerInfo || { first_name: 'Buyer' }, order.id);
            payment.setToken(paymentInfo.token);
            await this.paymentRepository.save(payment);
            token = paymentInfo.token;
          } catch (e) {
            console.error('Failed to initiate Midtrans Snap for revision', e);
          }
        }
      }

      await this.notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Anda menyetujui revisi berbayar untuk pesanan ${order.id}. Silakan selesaikan pembayaran agar admin dapat segera mengerjakannya.`
      );
      if (this.notificationService.sendToAdmins) {
        await this.notificationService.sendToAdmins('SYSTEM', `Buyer ACCEPTED revisi berbayar pada Pesanan #${order.id}`, `/admin/orders/${order.id}`);
      }

      return { request, paymentToken: token };
    } else {
      request.declinePaidRevision();
      await this.revisionRequestRepository.save(request);
      
      order.revertToWaitingBuyerConfirmation();
      await this.orderRepository.save(order);

      await this.notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Anda membatalkan revisi berbayar untuk pesanan ${order.id}.`
      );
      if (this.notificationService.sendToAdmins) {
        await this.notificationService.sendToAdmins('SYSTEM', `Buyer DECLINED revisi berbayar pada Pesanan #${order.id}`, `/admin/orders/${order.id}`);
      }
      
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

    // Ensure no pending REQUIRES_PAYMENT request is blocking
    const requests = await this.revisionRequestRepository.findAllByOrderId(orderId);
    const pendingPaid = requests.filter(r => r.getStatus() === 'REQUIRES_PAYMENT');
    if (pendingPaid.length > 0) {
      throw new Error('Masih ada revisi berbayar yang menunggu konfirmasi pembeli.');
    }

    order.startRevision();
    await this.orderRepository.save(order);
  }
}
