import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminDashboardPage() {
  await requireAdminPage();

  // Define active order statuses based on previous mapping
  const activeStatuses = [
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.REVISION_REQUESTED
  ];

  // 1. Fetch Total Active Orders
  const activeOrdersCount = await prisma.order.count({
    where: { status: { in: activeStatuses } }
  });

  // 2. Fetch Total Completed Orders
  const completedOrdersCount = await prisma.order.count({
    where: { status: OrderStatus.COMPLETED }
  });

  // 3. Fetch Estimated Revenue (sum of totalAmount for PAID, PROCESSING, REVISION, COMPLETED)
  const revenueStatuses = [...activeStatuses, OrderStatus.COMPLETED];
  const revenueAggregation = await prisma.order.aggregate({
    _sum: {
      totalAmount: true
    },
    where: { status: { in: revenueStatuses } }
  });
  
  const estimatedRevenue = revenueAggregation._sum.totalAmount 
    ? Number(revenueAggregation._sum.totalAmount) 
    : 0;

  // 4. Fetch Recent Orders for the table
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      package: { select: { name: true } },
      buyer: { select: { name: true, email: true } }
    }
  });

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1F1C18] mb-2">Overview</h1>
        <p className="text-[#7A7067]">Welcome back to ZuhraGraph. Here's what's happening today.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A7067]">Active Orders</h3>
            <span className="material-symbols-outlined text-[#9D4B36] bg-[#FDF5F3] p-2 rounded-lg">cycle</span>
          </div>
          <p className="text-4xl font-black text-[#1F1C18]">{activeOrdersCount}</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A7067]">Completed</h3>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-lg">task_alt</span>
          </div>
          <p className="text-4xl font-black text-[#1F1C18]">{completedOrdersCount}</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A7067]">Est. Revenue</h3>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-lg">payments</span>
          </div>
          <p className="text-4xl font-black text-[#1F1C18]">Rp {estimatedRevenue.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E8E0D5]">
          <h3 className="text-lg font-bold text-[#1F1C18]">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4EFEA] border-b border-[#E8E0D5] text-xs uppercase tracking-wider text-[#7A7067]">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Client</th>
                <th className="p-4 font-bold">Package</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D5]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#7A7067]">No recent orders found.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF6F0] transition-colors">
                    <td className="p-4 text-sm font-mono text-[#7A7067]">...{order.id.slice(-6)}</td>
                    <td className="p-4">
                      <div className="font-semibold text-[#1F1C18]">{order.buyer.name}</div>
                      <div className="text-xs text-[#7A7067]">{order.buyer.email}</div>
                    </td>
                    <td className="p-4 font-medium text-[#1F1C18]">{order.package.name}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#E8E0D5] text-[#1F1C18]">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-[#1F1C18]">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
