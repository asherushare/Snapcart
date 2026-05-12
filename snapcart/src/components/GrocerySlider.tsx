"use client";
import React, { useEffect, useMemo, useState } from "react";
import mongoose from "mongoose";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GroceryItemCard from "./GroceryItemCard";
import { IGrocery } from "@/models/grocery.model";

type GroceryCardItem = Omit<IGrocery, "_id"> & {
  _id: string | mongoose.Types.ObjectId;
};

interface GrocerySliderProps {
  groceryList: IGrocery[];
  /** When set, renders each item with this instead of GroceryItemCard (e.g. admin cards). */
  renderItem?: (item: GroceryCardItem) => React.ReactNode;
  title?: string;
  showTitle?: boolean;
  emptyMessage?: string;
  /** Extra classes for the outer wrapper (e.g. `mt-0` when no extra margin is needed). */
  className?: string;
}

const PAGE_SIZE = 12;

export default function GrocerySlider({
  groceryList,
  renderItem,
  title = "Popular Grocery Items",
  showTitle = true,
  emptyMessage = "No grocery items available.",
  className = "",
}: GrocerySliderProps) {
  const normalizedList = useMemo(
    () =>
      groceryList.map((item) => ({
        ...item,
        _id: item._id || "",
      })) as GroceryCardItem[],
    [groceryList],
  );

  const slides = useMemo(() => {
    const pages: GroceryCardItem[][] = [];
    for (let i = 0; i < normalizedList.length; i += PAGE_SIZE) {
      pages.push(normalizedList.slice(i, i + PAGE_SIZE));
    }
    return pages;
  }, [normalizedList]);

  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = slides.length;

  useEffect(() => {
    setCurrentPage(0);
  }, [normalizedList.length]);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const wrapperClass = `w-full max-w-[1200px] mx-auto mt-10 ${className}`.trim();

  if (totalPages === 0) {
    return (
      <div className={wrapperClass}>
        <p className="text-center text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-700">
            {title}
          </h2>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {totalPages > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-gray-200 shadow-sm text-green-700 hover:bg-green-50 transition-opacity duration-200 opacity-90 hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-gray-200 shadow-sm text-green-700 hover:bg-green-50 transition-opacity duration-200 opacity-90 hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div key={slideIndex} className="min-w-full p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {slide.map((item) =>
                  renderItem ? (
                    <React.Fragment key={item._id?.toString() ?? item.name}>
                      {renderItem(item)}
                    </React.Fragment>
                  ) : (
                    <GroceryItemCard
                      key={item._id?.toString() ?? item.name}
                      item={item}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm text-green-700 hover:bg-green-50 transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentPage ? "bg-green-700" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm text-green-700 hover:bg-green-50 transition"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
