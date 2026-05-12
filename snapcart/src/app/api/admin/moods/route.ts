import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { toSlug } from "@/lib/slug";
import Mood from "@/models/mood.model";
import { NextRequest, NextResponse } from "next/server";

async function notifyMoodsUpdated() {
  const base = process.env.NEXT_PUBLIC_SOCKET_SERVER;
  if (!base) return;
  try {
    await fetch(`${base.replace(/\/$/, "")}/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "moods-updated", data: { ts: Date.now() } }),
      cache: "no-store",
    });
  } catch {
    // Best-effort realtime only.
  }
}

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "You are not an admin" }, { status: 400 });
    }

    const moods = await Mood.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ moods }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `get moods error ${error}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "You are not an admin" }, { status: 400 });
    }

    const body = (await req.json()) as {
      name: string;
      subtitle?: string;
      description?: string;
      image?: string;
      categoryNames?: string[];
      keywords?: string[];
      manualGroceryIds?: string[];
      slug?: string;
    };

    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ message: "Mood name is required" }, { status: 400 });
    }

    const slug = toSlug(body.slug?.trim() || name);
    if (!slug) {
      return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
    }

    const exists = await Mood.findOne({ slug }).select({ _id: 1 }).lean();
    if (exists) {
      return NextResponse.json({ message: "Mood slug already exists" }, { status: 409 });
    }

    const mood = await Mood.create({
      slug,
      name,
      subtitle: body.subtitle?.trim() || undefined,
      description: body.description?.trim() || undefined,
      image: body.image?.trim() || undefined,
      categoryNames: Array.isArray(body.categoryNames) ? body.categoryNames : [],
      keywords: Array.isArray(body.keywords)
        ? body.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [],
      manualGroceryIds: Array.isArray(body.manualGroceryIds) ? body.manualGroceryIds : [],
    });

    await notifyMoodsUpdated();
    return NextResponse.json({ mood }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `create mood error ${error}` }, { status: 500 });
  }
}

