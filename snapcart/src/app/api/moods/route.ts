import connectDb from "@/lib/db";
import Mood from "@/models/mood.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const moods = await Mood.find({})
      .select({ slug: 1, name: 1, subtitle: 1, image: 1 })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ moods }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `get moods error ${error}` }, { status: 500 });
  }
}

