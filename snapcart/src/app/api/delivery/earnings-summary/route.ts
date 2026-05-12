import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const deliveryBoyId = session?.user?.id;

    if (!deliveryBoyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const deliveredOrders = await Order.find({
      assignedDeliveryBoy: deliveryBoyId,
      deliveryOtpVerification: true,
      deliveredAt: { $exists: true },
    }).lean();

    const totalDeliveries = deliveredOrders.length;
    const totalEarning = totalDeliveries * 40;

    const todayDeliveries = deliveredOrders.filter((order) => {
      if (!order.deliveredAt) return false;
      const deliveredAt = new Date(order.deliveredAt);
      return deliveredAt >= todayStart && deliveredAt <= todayEnd;
    }).length;

    const weekDeliveries = deliveredOrders.filter((order) => {
      if (!order.deliveredAt) return false;
      const deliveredAt = new Date(order.deliveredAt);
      return deliveredAt >= weekStart && deliveredAt <= todayEnd;
    }).length;

    const dailyBreakdown = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const dayDeliveries = deliveredOrders.filter((order) => {
        if (!order.deliveredAt) return false;
        const deliveredAt = new Date(order.deliveredAt);
        return deliveredAt >= dayStart && deliveredAt <= dayEnd;
      }).length;

      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        earnings: dayDeliveries * 40,
      };
    });

    return NextResponse.json(
      {
        todayEarning: todayDeliveries * 40,
        weekEarning: weekDeliveries * 40,
        totalEarning,
        totalDeliveries,
        dailyBreakdown,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: `earnings summary error ${err}` },
      { status: 500 },
    );
  }
}
