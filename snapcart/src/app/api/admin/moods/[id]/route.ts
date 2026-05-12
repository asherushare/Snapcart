import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { toSlug } from "@/lib/slug";
import Mood from "@/models/mood.model";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "You are not an admin" }, { status: 400 });
    }

    const { id } = await params;
    const mood = await Mood.findById(id).lean();
    if (!mood) {
      return NextResponse.json({ message: "Mood not found" }, { status: 404 });
    }
    return NextResponse.json({ mood }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `get mood error ${error}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "You are not an admin" }, { status: 400 });
    }

    const { id } = await params;
    const body = (await req.json()) as {
      slug?: string;
      name?: string;
      subtitle?: string;
      description?: string;
      image?: string;
      categoryNames?: string[];
      keywords?: string[];
      manualGroceryIds?: string[];
    };

    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") update.name = body.name.trim();
    if (typeof body.subtitle === "string") update.subtitle = body.subtitle.trim() || undefined;
    if (typeof body.description === "string")
      update.description = body.description.trim() || undefined;
    if (typeof body.image === "string") update.image = body.image.trim() || undefined;
    if (Array.isArray(body.categoryNames)) update.categoryNames = body.categoryNames;
    if (Array.isArray(body.keywords))
      update.keywords = body.keywords.map((k) => String(k).trim()).filter(Boolean);
    if (Array.isArray(body.manualGroceryIds)) update.manualGroceryIds = body.manualGroceryIds;

    if (typeof body.slug === "string") {
      const newSlug = toSlug(body.slug.trim());
      if (!newSlug) {
        return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
      }
      const other = await Mood.findOne({ slug: newSlug, _id: { $ne: id } })
        .select({ _id: 1 })
        .lean();
      if (other) {
        return NextResponse.json({ message: "Mood slug already exists" }, { status: 409 });
      }
      update.slug = newSlug;
    }

    const mood = await Mood.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!mood) {
      return NextResponse.json({ message: "Mood not found" }, { status: 404 });
    }
    await notifyMoodsUpdated();
    return NextResponse.json({ mood }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `update mood error ${error}` }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "You are not an admin" }, { status: 400 });
    }

    const { id } = await params;
    const mood = await Mood.findByIdAndDelete(id).lean();
    if (!mood) {
      return NextResponse.json({ message: "Mood not found" }, { status: 404 });
    }
    await notifyMoodsUpdated();
    return NextResponse.json({ mood }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `delete mood error ${error}` }, { status: 500 });
  }
}

