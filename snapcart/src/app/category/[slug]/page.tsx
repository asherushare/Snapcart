import { auth } from "@/auth";
import EditRoleMobile from "@/components/EditRoleMobile";
import Footer from "@/components/Footer";
import GeoUpdater from "@/components/GeoUpdater";
import Nav from "@/components/Nav";
import CategorySlider from "@/components/CategorySlider";
import GrocerySlider from "@/components/GrocerySlider";
import connectDb from "@/lib/db";
import { getCategoryNameFromSlug } from "@/lib/categories";
import Grocery, { IGrocery } from "@/models/grocery.model";
import User from "@/models/user.model";
import Link from "next/link";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import React from "react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = getCategoryNameFromSlug(slug);
  if (!name) return { title: "Category | Snapcart" };
  return {
    title: `${name} | Snapcart`,
    description: `Shop ${name} on Snapcart — fast grocery delivery.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categoryName = getCategoryNameFromSlug(slug);
  if (!categoryName) notFound();

  await connectDb();
  const session = await auth();
  const user = await User.findById(session?.user?.id);
  if (!user) redirect("/login");

  const inComplete =
    !user.mobile ||
    !user.role ||
    (!user.mobile && user.role == "user");
  if (inComplete) {
    return <EditRoleMobile />;
  }

  if (user.role !== "user") {
    redirect("/");
  }

  const groceries = await Grocery.find({ category: categoryName }).lean();
  const plainGrocery = JSON.parse(JSON.stringify(groceries)) as IGrocery[];
  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <>
      <Nav user={plainUser} />
      <GeoUpdater userId={plainUser._id} />
      <main className="min-h-[50vh]">
        <div className="w-[90%] md:w-[80%] mx-auto pt-6 pb-2">
          <nav className="text-sm text-gray-600 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-green-700 hover:underline">
              Home
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{categoryName}</span>
          </nav>
          <p className="text-gray-600 text-sm">
            Browse products in this category. Switch categories anytime using
            the strip below.
          </p>
        </div>
        <CategorySlider activeCategoryName={categoryName} />
        {plainGrocery.length === 0 ? (
          <div className="w-full max-w-[1200px] mx-auto mt-10 px-4 text-center pb-8">
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              No items in this category yet. Try another category above or
              return to the home page.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-green-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-green-700 transition"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <GrocerySlider
            groceryList={plainGrocery}
            title={categoryName}
            emptyMessage="No grocery items available."
          />
        )}
      </main>
      <Footer />
    </>
  );
}
