import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import emitEventHandler from "@/lib/emitEventHandler";
import Grocery from "@/models/grocery.model";
import Order from "@/models/order.model";
import RepeatOrder, { type RepeatFrequency } from "@/models/repeatOrder.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

function addInterval(from: Date, frequency: RepeatFrequency) {
  const next = new Date(from);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setDate(next.getDate() + 30);
  return next;
}

function msUntil(date: Date) {
  return date.getTime() - Date.now();
}

function reminderHtml(userName: string, productName: string, nextAt: Date) {
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; line-height: 1.4;">
    <h2 style="margin:0 0 8px; color:#166534;">Snapcart Repeat Order Reminder</h2>
    <p style="margin:0 0 12px;">Hi ${userName || "there"},</p>
    <p style="margin:0 0 12px;">
      Your repeat order for <b>${productName}</b> is scheduled for
      <b>${nextAt.toLocaleString("en-IN")}</b>.
    </p>
    <p style="margin:0 0 12px; color:#374151;">
      Payment method: <b>Cash on Delivery</b>
    </p>
    <p style="margin:0; color:#6b7280;">You can pause/cancel it anytime from “My Repeat Orders”.</p>
  </div>`;
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const headerSecret = req.headers.get("x-cron-secret");
      if (headerSecret !== cronSecret) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDb();

    const now = new Date();
    const reminderWindowMs = 24 * 60 * 60 * 1000; // 24h

    // 1) Send reminders
    const upcoming = await RepeatOrder.find({
      status: "active",
      nextRunAt: { $gte: now, $lte: new Date(now.getTime() + reminderWindowMs) },
    })
      .populate("grocery")
      .populate("user")
      .lean();

    let remindersSent = 0;
    for (const r of upcoming as any[]) {
      const nextAt = new Date(r.nextRunAt);
      const alreadySent =
        r.lastReminderSentAt &&
        new Date(r.lastReminderSentAt).getTime() > nextAt.getTime() - reminderWindowMs;
      if (alreadySent) continue;

      const user = r.user;
      const grocery = r.grocery;
      if (!user?.email || !grocery?.name) continue;

      await sendMail(
        user.email,
        "Reminder: upcoming repeat order",
        reminderHtml(user.name, grocery.name, nextAt),
      );
      await RepeatOrder.updateOne({ _id: r._id }, { $set: { lastReminderSentAt: now } });
      remindersSent += 1;
    }

    // 2) Place due orders (COD)
    const due = await RepeatOrder.find({
      status: "active",
      nextRunAt: { $lte: now },
    })
      .sort({ nextRunAt: 1 })
      .limit(50)
      .lean();

    let ordersCreated = 0;
    let skipped = 0;

    for (const r of due as any[]) {
      const user = await User.findById(r.user).lean();
      if (!user) {
        await RepeatOrder.updateOne(
          { _id: r._id },
          { $set: { nextRunAt: addInterval(now, r.frequency), lastRunAt: now } },
        );
        skipped += 1;
        continue;
      }

      const grocery = await Grocery.findById(r.grocery).lean();
      if (!grocery) {
        // Skip this cycle if product was removed.
        await RepeatOrder.updateOne(
          { _id: r._id },
          { $set: { nextRunAt: addInterval(now, r.frequency), lastRunAt: now } },
        );
        skipped += 1;
        continue;
      }

      // Use user's latest order address as the default delivery address.
      const lastOrder = await Order.findOne({ user: user._id })
        .sort({ createdAt: -1 })
        .lean();

      if (!lastOrder?.address) {
        // Can't place without an address; pause.
        await RepeatOrder.updateOne(
          { _id: r._id },
          { $set: { status: "paused" } },
        );
        skipped += 1;
        continue;
      }

      const quantity = Math.max(1, Math.min(50, Number(r.quantity ?? 1)));
      const totalAmount = Number(grocery.price) * quantity;

      const newOrder = await Order.create({
        user: user._id,
        items: [
          {
            grocery: grocery._id,
            name: grocery.name,
            price: grocery.price,
            unit: grocery.unit,
            image: grocery.image,
            quantity,
          },
        ],
        paymentMethod: "cod",
        isPaid: false,
        totalAmount,
        address: lastOrder.address,
      });

      await emitEventHandler("new-order", newOrder);

      await RepeatOrder.updateOne(
        { _id: r._id },
        {
          $set: {
            nextRunAt: addInterval(now, r.frequency),
            lastRunAt: now,
            lastReminderSentAt: undefined,
          },
        },
      );

      ordersCreated += 1;
    }

    return NextResponse.json(
      { ok: true, remindersSent, ordersCreated, skipped, now, upcomingMs: reminderWindowMs, },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: `repeat tick error: ${error}` },
      { status: 500 },
    );
  }
}

