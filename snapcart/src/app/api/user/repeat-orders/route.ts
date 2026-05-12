import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
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

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const repeats = await RepeatOrder.find({ user: userId })
      .populate("grocery")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ repeats }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `get repeat orders error: ${error}` },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      groceryId: string;
      quantity?: number;
      frequency?: RepeatFrequency;
    };

    const groceryId = String(body?.groceryId || "").trim();
    const quantity = Math.max(1, Math.min(50, Number(body?.quantity ?? 1)));
    const frequency: RepeatFrequency =
      body?.frequency === "monthly" ? "monthly" : "weekly";

    if (!groceryId) {
      return NextResponse.json({ message: "groceryId is required" }, { status: 400 });
    }

    const grocery = await Grocery.findById(groceryId).select({ _id: 1 }).lean();
    if (!grocery) {
      return NextResponse.json({ message: "Grocery not found" }, { status: 404 });
    }

    const nextRunAt = nextRunAtFromNow(frequency);

    const repeat = await RepeatOrder.findOneAndUpdate(
      { user: userId, grocery: groceryId },
      {
        $set: {
          quantity,
          frequency,
          status: "active",
          nextRunAt,
        },
      },
      { upsert: true, new: true },
    ).lean();

    await notifyRepeatOrdersUpdated(userId);

    return NextResponse.json({ repeat }, { status: 201 });
  } catch (error: any) {
    const msg = String(error?.message || "");
    // Unique index collision fallback
    if (msg.includes("E11000")) {
      return NextResponse.json(
        { message: "Repeat order already exists for this product" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: `create repeat order error: ${error}` },
      { status: 500 },
    );
  }
}

