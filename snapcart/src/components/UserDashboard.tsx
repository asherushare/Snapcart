// import React from 'react'
// import HeroSection from './HeroSection'
// import CategorySlider from './CategorySlider'
// import connectDb from '@/lib/db'
// import Grocery from '@/models/grocery.model'
// import GroceryItemCard from './GroceryItemCard'

// async function UserDashboard() {
//   await connectDb()
//   const groceries = await Grocery.find({}).lean()
//   return (
//     <>
//       <HeroSection />
//       <CategorySlider />
//       <div className="w-[90%] md:w-[80%] mx-auto mt-10">
//         <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center">Popular Grocery Items</h2>
//         <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
//           {groceries.map((item) => (
//             <GroceryItemCard key={item._id} item={item} />
//           ))}
//         </div>
//       </div>
//     </>
//   );
// }

// export default UserDashboard

import React from "react";
import HeroSection from "./HeroSection";
import CategorySlider from "./CategorySlider";
import GrocerySlider from "./GrocerySlider";
import MoodSlider from "./MoodSlider";
import connectDb from "@/lib/db";
import { IGrocery } from "@/models/grocery.model";

async function UserDashboard({
  groceryList,
  similarGroceryList = [],
  searchQuery,
  similarCategory,
}: {
  groceryList: IGrocery[];
  similarGroceryList?: IGrocery[];
  searchQuery?: string;
  similarCategory?: string | null;
}) {
  await connectDb();
  const plainGrocery = JSON.parse(JSON.stringify(groceryList));
  const plainSimilar = JSON.parse(JSON.stringify(similarGroceryList));
  const q = (searchQuery || "").trim();
  const isSearching = q.length > 0;
  const showSimilar = q && plainGrocery.length === 0 && plainSimilar.length > 0;

  return (
    <>
      {/* Premium UX: collapse marketing hero while user is actively searching */}
      {!isSearching ? (
        <HeroSection />
      ) : (
        <section className="pt-28 md:pt-32">
          <div className="w-[90%] md:w-[80%] mx-auto">
            <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-md shadow-sm px-5 py-4 md:px-7 md:py-5">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Search
              </p>
              <h1 className="mt-1 text-lg md:text-xl font-extrabold text-gray-900">
                {showSimilar
                  ? similarCategory
                    ? `No results for “${q}”. Similar in ${similarCategory}`
                    : `No results for “${q}”. Similar products`
                  : `Showing results for “${q}”`}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Tip: try a shorter keyword, or browse categories below.
              </p>
            </div>
          </div>
        </section>
      )}
      {!isSearching ? <MoodSlider /> : null}
      <CategorySlider />
      {showSimilar ? (
        <GrocerySlider
          groceryList={plainSimilar}
          title={similarCategory ? `Similar in ${similarCategory}` : "Similar products"}
          emptyMessage="No similar items available."
        />
      ) : isSearching ? (
        <GrocerySlider
          groceryList={plainGrocery}
          title={`Search results for “${q}”`}
          emptyMessage="No grocery items available."
        />
      ) : (
        <GrocerySlider groceryList={plainGrocery} />
      )}
    </>
  );
}

export default UserDashboard;
