import { auth } from '@/auth';
import AdminDashboard from '@/components/AdminDashboard';
import DeliveryBoy from '@/components/DeliveryBoy';
import EditRoleMobile from '@/components/EditRoleMobile';
import Footer from '@/components/Footer';
import GeoUpdater from '@/components/GeoUpdater';
import Nav from '@/components/Nav';
import UserDashboard from '@/components/UserDashboard';
import connectDb from '@/lib/db'
import { SHOP_CATEGORIES } from "@/lib/categories";
import Grocery, { IGrocery } from '@/models/grocery.model';
import User from '@/models/user.model';
import { redirect } from 'next/navigation';
import React from 'react'

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshtein(aRaw: string, bRaw: string) {
  const a = aRaw.toLowerCase();
  const b = bRaw.toLowerCase();
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

type GroceryNameCategory = {
  name: string;
  category: string;
};

async function Home(props: {
  searchParams: Promise<{
    q: string
  }>
}) {

  const searchParams = await props.searchParams;

  await connectDb();
  const session = await auth();
  const user = await User.findById(session?.user?.id);
  if(!user) {
    redirect("/login");
  }

  const inComplete = !user.mobile || !user.role || (!user.mobile && user.role == "user");
  if(inComplete) {
    return <EditRoleMobile />
  }

  const plainUser = JSON.parse(JSON.stringify(user));

  let groceryList: IGrocery[] = [];
  let similarGroceryList: IGrocery[] = [];
  let similarCategory: string | null = null;

  if (user.role === "user") {
    if (searchParams.q) {
      const q = String(searchParams.q || "").trim();
      groceryList = await Grocery.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
        ],
      });

      // If nothing matches the search query, suggest similar products
      // from the same category (category inferred from query/category keywords
      // or best fuzzy name match).
      if (groceryList.length === 0 && q) {
        const normalizedQ = q.toLowerCase();

        // 1) Try to infer category directly from the query (category name/slug keywords).
        const inferred = SHOP_CATEGORIES.find((c) => {
          const name = c.name.toLowerCase();
          const slug = c.slug.toLowerCase().replace(/-/g, " ");
          return (
            normalizedQ.includes(name) ||
            normalizedQ.includes(slug) ||
            name
              .split(/[\s,&]+/g)
              .filter(Boolean)
              .some((token) => token.length >= 4 && normalizedQ.includes(token))
          );
        });

        similarCategory = inferred?.name ?? null;

        // 2) If no category keyword match, guess intended product via fuzzy name match,
        // then use that product's category as the "same category" fallback.
        if (!similarCategory) {
          const prefixLen = Math.min(3, normalizedQ.length);
          const prefix = normalizedQ.slice(0, prefixLen);

          const candidates = await Grocery.find(
            prefixLen
              ? { name: { $regex: escapeRegex(prefix), $options: "i" } }
              : {},
          )
            .select({ name: 1, category: 1 })
            .limit(40)
            .lean<GroceryNameCategory[]>();

          let best: { name: string; category: string } | null = null;
          let bestScore = Number.POSITIVE_INFINITY;

          for (const c of candidates) {
            if (!c?.name || !c?.category) continue;
            const score = levenshtein(normalizedQ, String(c.name));
            if (score < bestScore) {
              bestScore = score;
              best = { name: String(c.name), category: String(c.category) };
            }
          }

          // Only accept a fuzzy match if it's reasonably close.
          // (helps avoid irrelevant category picks for completely different queries)
          if (best) {
            const maxAllowed = Math.max(2, Math.ceil(normalizedQ.length * 0.45));
            if (bestScore <= maxAllowed) {
              similarCategory = best.category;
            }
          }
        }

        if (similarCategory) {
          similarGroceryList = await Grocery.find({ category: similarCategory })
            .limit(12)
            .lean();
        }
      }
    } else {
      groceryList = await Grocery.find({});
    }
  }

  
  return (
    <>
      <Nav user = {plainUser} />
      <GeoUpdater userId = {plainUser._id} />
      {
        user.role == "user" ? (
          <UserDashboard
            groceryList={groceryList}
            similarGroceryList={similarGroceryList}
            searchQuery={searchParams.q}
            similarCategory={similarCategory}
          />
        ) : user.role == "admin" ? (
          <AdminDashboard />
        ) : <DeliveryBoy />
      }
      <Footer />
    </>
  )
}

export default Home
