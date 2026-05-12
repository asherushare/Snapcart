import { auth } from "@/auth";
import EditRoleMobile from "@/components/EditRoleMobile";
import Footer from "@/components/Footer";
import GeoUpdater from "@/components/GeoUpdater";
import Nav from "@/components/Nav";
import GrocerySlider from "@/components/GrocerySlider";
import connectDb from "@/lib/db";
import Mood from "@/models/mood.model";
import Grocery, { IGrocery } from "@/models/grocery.model";
import User from "@/models/user.model";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React from "react";
import { type IMood } from "@/models/mood.model";
import mongoose from "mongoose";

type Props = { params: Promise<{ slug: string }> };

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function MoodPage({ params }: Props) {
  const { slug } = await params;

  await connectDb();
  const session = await auth();
  const user = await User.findById(session?.user?.id);
  if (!user) redirect("/login");

  const inComplete =
    !user.mobile || !user.role || (!user.mobile && user.role == "user");
  if (inComplete) {
    return <EditRoleMobile />;
  }
  if (user.role !== "user") {
    redirect("/");
  }

  const mood = await Mood.findOne({ slug }).lean<IMood | null>();
  if (!mood) notFound();

  const or: Record<string, unknown>[] = [];
  if (Array.isArray(mood.categoryNames) && mood.categoryNames.length > 0) {
    or.push({ category: { $in: mood.categoryNames } });
  }

  if (Array.isArray(mood.keywords) && mood.keywords.length > 0) {
    const parts = mood.keywords.map((k) => escapeRegex(String(k)));
    const regex = new RegExp(parts.join("|"), "i");
    or.push({ name: { $regex: regex } });
  }

  if (Array.isArray(mood.manualGroceryIds) && mood.manualGroceryIds.length > 0) {
    or.push({ _id: { $in: mood.manualGroceryIds } });
  }

  const query = or.length > 0 ? { $or: or } : {};
  const groceries = await Grocery.find(query as any).limit(48).lean();

  const plainUser = JSON.parse(JSON.stringify(user));
  const plainGroceries = JSON.parse(JSON.stringify(groceries)) as IGrocery[];

  return (
    <>
      <Nav user={plainUser} />
      <GeoUpdater userId={plainUser._id} />
      <main className="min-h-[50vh] pt-24 pb-2">
        <div className="w-[90%] md:w-[80%] mx-auto">
          <nav className="text-sm text-gray-600 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-green-700 hover:underline">
              Home
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{mood.name}</span>
          </nav>

          <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-md shadow-sm px-5 py-5 md:px-7 md:py-6">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Mood
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-gray-900">
              {mood.name}
            </h1>
            {mood.subtitle ? (
              <p className="mt-2 text-gray-700 font-semibold">{mood.subtitle}</p>
            ) : null}
            {mood.description ? (
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                {mood.description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                Curated picks to match your moment. Add to cart in one go.
              </p>
            )}
          </div>
        </div>

        <GrocerySlider
          groceryList={plainGroceries}
          title={`${mood.name} picks`}
          emptyMessage="No products found for this mood yet. Try another mood or check back later."
        />
      </main>
      <Footer />
    </>
  );
}

