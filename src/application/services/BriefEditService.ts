import { BriefEditRequest } from '../../domain/entities/BriefEditRequest';
import { BriefEditRequestRepository } from '../../domain/interfaces/BriefEditRequestRepository';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { NotificationService } from '../../domain/interfaces/NotificationService';
import { v4 as uuidv4 } from 'uuid';

export class BriefEditService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly briefEditRequestRepository: BriefEditRequestRepository,
    private readonly notificationService: NotificationService
  ) {}

  public async requestBriefEdit(buyerId: string, orderId: string, proposedBrief: string): Promise<{ directUpdate: boolean; request?: BriefEditRequest }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pesanan tidak ditemukan');
    }

    if (order.buyerId !== buyerId) {
      throw new Error('Anda tidak memiliki akses ke pesanan ini.');
    }

    const orderStatus = order.getStatus();

    if (orderStatus === 'COMPLETED' || orderStatus === 'CANCELLED') {
      throw new Error('Pesanan sudah selesai atau dibatalkan, tidak dapat mengubah brief.');
    }

    // Direct update allowed for PENDING or AWAITING_PAYMENT
    if (orderStatus === 'PENDING' || orderStatus === 'AWAITING_PAYMENT') {
      order.brief = proposedBrief;
      await this.orderRepository.save(order);
      return { directUpdate: true };
    }

    // Require request and approval for other states (PAID, CONFIRMED, PROCESSING, etc.)
    const existingPending = await this.briefEditRequestRepository.findPendingByOrderId(orderId);
    if (existingPending) {
      throw new Error('Sudah ada permintaan perubahan brief yang sedang menunggu persetujuan.');
    }

    const briefRequest = new BriefEditRequest(
      uuidv4(),
      orderId,
      proposedBrief,
      'PENDING',
      null,
      new Date(),
      new Date()
    );

    await this.briefEditRequestRepository.save(briefRequest);
    
    // Notify admin or log
    await this.notificationService.sendNotification(
      order.buyerId,
      'SYSTEM',
      `Permintaan perubahan brief untuk pesanan ${order.id} telah diajukan.`
    );

    return { directUpdate: false, request: briefRequest };
  }

  public async decideBriefEdit(requestId: string, approve: boolean, reason?: string): Promise<BriefEditRequest> {
    const request = await this.briefEditRequestRepository.findById(requestId);
    if (!request) {
      throw new Error('Permintaan perubahan brief tidak ditemukan');
    }

    if (request.getStatus() !== 'PENDING') {
      throw new Error('Keputusan hanya dapat dibuat untuk permintaan berstatus PENDING.');
    }

    const order = await this.orderRepository.findById(request.orderId);
    if (!order) {
      throw new Error('Pesanan terkait tidak ditemukan');
    }

    if (approve) {
      request.approve(reason);
      order.brief = request.proposedBrief;
      await this.orderRepository.save(order);
      await this.briefEditRequestRepository.save(request);

      await this.notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Permintaan perubahan brief untuk pesanan ${order.id} telah DISETUJUI. ${reason ? `Alasan: ${reason}` : ''}`
      );
    } else {
      if (!reason || !reason.trim()) {
        throw new Error('Alasan penolakan wajib diisi.');
      }
      request.reject(reason);
      await this.briefEditRequestRepository.save(request);

      await this.notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Permintaan perubahan brief untuk pesanan ${order.id} telah DITOLAK. Alasan: ${reason}`
      );
    }

    return request;
  }
}
