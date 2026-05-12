'use client'
import { Apple, Baby, Box, ChevronLeft, ChevronRight, Coffee, Cookie, Flame, Heart, Home, Milk, Wheat, type LucideIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import {motion} from 'motion/react'
import Link from 'next/link'
import { SHOP_CATEGORIES } from '@/lib/categories'

const CATEGORY_VISUALS: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  "fruits-vegetables": { icon: Apple, color: "bg-green-100" },
  "dairy-eggs": { icon: Milk, color: "bg-yellow-100" },
  "rice-atta-grains": { icon: Wheat, color: "bg-orange-100" },
  "snacks-biscuits": { icon: Cookie, color: "bg-pink-100" },
  "spices-masalas": { icon: Flame, color: "bg-red-100" },
  "beverages-drinks": { icon: Coffee, color: "bg-blue-100" },
  "personal-care": { icon: Heart, color: "bg-purple-100" },
  "household-essentials": { icon: Home, color: "bg-lime-100" },
  "instant-packaged-food": { icon: Box, color: "bg-teal-100" },
  "baby-pet-care": { icon: Baby, color: "bg-rose-100" },
}

type CategorySliderProps = {
  /** When set (e.g. on /category/[slug]), that category is visually highlighted. */
  activeCategoryName?: string
}

function CategorySlider({ activeCategoryName }: CategorySliderProps) {
    const categories = SHOP_CATEGORIES.map((c) => {
      const visual = CATEGORY_VISUALS[c.slug]
      return {
        slug: c.slug,
        name: c.name,
        icon: visual?.icon ?? Apple,
        color: visual?.color ?? "bg-green-100",
      }
    })

    // const [showLeft, setShowLeft] = useState<boolean>();
    // const [showRight, setShowRight] = useState<boolean>();
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (direction: "left" | "right") => {
      if (!scrollRef.current) return;
      const scrollAmount = direction == "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    };

     const checkScroll = () => {
       if (!scrollRef.current) return;
       const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

       setShowLeft(scrollLeft > 0);
       setShowRight(scrollLeft + clientWidth <= scrollWidth - 5);
     };

     useEffect(() => {
       const autoScroll = setInterval(() => {
         if (!scrollRef.current) return;
         const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
         if (scrollLeft + clientWidth >= scrollWidth - 5) {
           scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
         } else {
           scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
         }
       }, 3000);
       return () => clearInterval(autoScroll);
     }, []);

    //  useEffect(() => {
    //    scrollRef.current?.addEventListener("scroll", checkScroll);
    //    checkScroll();
    //    return () => removeEventListener("scroll", checkScroll);
    //  }, []);
    useEffect(() => {
      const element = scrollRef.current;
      if (!element) return;

      element.addEventListener("scroll", checkScroll);
      checkScroll();

      return () => {
        element.removeEventListener("scroll", checkScroll);
      };
    }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false, amount: 0.5 }}
      className="w-[90%] md:w-[80%] mx-auto mt-10 relative"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center">
        🛒 Shop by Category
      </h2>
      {showLeft && (
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-green-100 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="w-6 h-6 text-green-700" />
        </button>
      )}

      <div
        className="flex gap-6 overflow-x-auto px-10 pb-4 scrollbar-hide scroll-smooth"
        ref={scrollRef}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategoryName === cat.name;
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="shrink-0"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`min-w-37.5 md:min-w-45 flex flex-col items-center justify-center rounded-2xl ${cat.color} shadow-md hover:shadow-xl transition-all cursor-pointer ${
                  isActive
                    ? "ring-2 ring-green-600 ring-offset-2 ring-offset-green-50 scale-[1.02]"
                    : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center p-5">
                  <Icon className="w-10 h-10 text-green-700 mb-3" />
                  <p className="text-center text-sm md:text-base font-semibold text-gray-700">
                    {cat.name}
                  </p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
      {showRight && (
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-green-100 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="w-6 h-6 text-green-700" />
        </button>
      )}
    </motion.div>
  );
}

export default CategorySlider
