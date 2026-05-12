import Link from "next/link";
import React from "react";

export default function CategoryNotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-green-800 mb-2">
        Category not found
      </h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        This category does not exist or the link is invalid.
      </p>
      <Link
        href="/"
        className="rounded-full bg-green-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-green-700 transition"
      >
        Back to home
      </Link>
    </div>
  );
}
