import { auth } from "@/auth";
import connectDb from "@/lib/db";
import RepeatOrder, { type RepeatFrequency } from "@/models/repeatOrder.model";
import { NextRequest, NextResponse } from "next/server";

async function notifyRepeatOrdersUpdated(userId: string) {
  const base = process.env.NEXT_PUBLIC_SOCKET_SERVER;
  if (!base) return;
  try {
    await fetch(`${base.replace(/\/$/, "")}/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "repeat-orders-updated",
        data: { userId, ts: Date.now() },
      }),
      cache: "no-store",
    });
  } catch {
    // Best-effort realtime only.
  }
}

function nextRunAtFromNow(frequency: RepeatFrequency) {
  const now = new Date();
  const next = new Date(now);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setDate(next.getDate() + 30);
  return next;
}

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as {
      status?: "active" | "paused";
      quantity?: number;
      frequency?: RepeatFrequency;
    };

    const update: Record<string, unknown> = {};
    if (typeof body.status === "string" && ["active", "paused"].includes(body.status)) {
      update.status = body.status;
    }
    if (typeof body.quantity === "number") {
      update.quantity = Math.max(1, Math.min(50, Number(body.quantity)));
    }
    if (body.frequency === "weekly" || body.frequency === "monthly") {
      update.frequency = body.frequency;
      update.nextRunAt = nextRunAtFromNow(body.frequency);
      update.lastReminderSentAt = undefined;
    }

    const repeat = await RepeatOrder.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: update },
      { new: true },
    ).lean();

    if (!repeat) {
      return NextResponse.json({ message: "Repeat order not found" }, { status: 404 });
    }

    await notifyRepeatOrdersUpdated(String(userId));
    return NextResponse.json({ repeat }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `update repeat order error: ${error}` },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const repeat = await RepeatOrder.findOneAndDelete({ _id: id, user: userId }).lean();
    if (!repeat) {
      return NextResponse.json({ message: "Repeat order not found" }, { status: 404 });
    }
    await notifyRepeatOrdersUpdated(String(userId));
    return NextResponse.json({ repeat }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `delete repeat order error: ${error}` },
      { status: 500 },
    );
  }
}

