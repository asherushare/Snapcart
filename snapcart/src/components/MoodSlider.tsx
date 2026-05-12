"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getSocket } from "@/lib/socket";

type MoodCard = {
  slug: string;
  name: string;
  subtitle?: string;
  image?: string;
};

export default function MoodSlider() {
  const [moods, setMoods] = useState<MoodCard[]>([]);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, true>>({});

  const load = async () => {
    try {
      const res = await axios.get("/api/moods");
      setMoods(res.data?.moods || []);
    } catch {
      setMoods([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Realtime: admin mood changes push an event via socket server.
  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      load();
    };

    socket.on("moods-updated", handler);
    return () => {
      socket.off("moods-updated", handler);
    };
  }, []);

  const cards = useMemo(() => moods.filter((m) => m?.slug && m?.name), [moods]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft + clientWidth <= scrollWidth - 5);
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => element.removeEventListener("scroll", checkScroll);
  }, [cards.length]);

  if (cards.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false, amount: 0.35 }}
      className="w-[90%] md:w-[80%] mx-auto mt-10 relative"
    >
      <div className="flex items-center justify-center gap-2 mb-6 text-center">
        <Sparkles className="w-6 h-6 text-green-700" />
        <h2 className="text-2xl md:text-3xl font-bold text-green-700">
          Shop by Mood
        </h2>
      </div>

      {showLeft && (
        <button
          type="button"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-green-100 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-green-700" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto px-10 pb-4 scrollbar-hide scroll-smooth"
      >
        {cards.map((m) => (
          <Link key={m.slug} href={`/mood/${m.slug}`} className="shrink-0">
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="min-w-64 md:min-w-80 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition overflow-hidden"
            >
              <div className="relative h-24 bg-linear-to-r from-green-500 to-green-700">
                {m.image && !brokenImages[m.slug] ? (
                  // Use <img> (not next/image) so any online URL works without config.
                  // We keep a gradient overlay so text always stays readable.
                  <img
                    src={m.image}
                    alt={m.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [m.slug]: true }))
                    }
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.9),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.7),transparent_40%)]" />
              </div>
              <div className="px-5 pt-4 pb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shrink-0">
                    <Sparkles className="w-4 h-4 text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-extrabold text-gray-900 truncate">
                      {m.name}
                    </div>
                  </div>
                </div>
                {m.subtitle ? (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {m.subtitle}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">
                    Curated picks for your moment.
                  </p>
                )}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {showRight && (
        <button
          type="button"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-green-100 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-green-700" />
        </button>
      )}
    </motion.section>
  );
}

