"use client";
import {
  Boxes,
  Clipboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Repeat,
  Search,
  ShoppingCartIcon,
  User,
  Settings,
  X,
  Sparkles,
  Wallet,
  Landmark,
  IndianRupee,
  Clock3,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  mobile: string;
  role: "user" | "deliveryBoy" | "admin";
  image?: string;
}

interface IBankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

function Nav({ user }: { user: IUser }) {
  const [open, setOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletView, setWalletView] = useState<
    "overview" | "bank" | "withdrawals"
  >("overview");
  const [bankDetails, setBankDetails] = useState<IBankDetails>({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
  });
  const [bankSaved, setBankSaved] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const profileDropDown = useRef<HTMLDivElement | null>(null);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartData } = useSelector((state: RootState) => state.cart);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTimeout = useRef<number | null>(null);
  const withdrawalHistory = [
    {
      id: "WD-2145",
      date: "05 May 2026",
      amount: 1200,
      status: "Processed",
      mode: "Bank Transfer",
    },
    {
      id: "WD-2048",
      date: "01 May 2026",
      amount: 900,
      status: "Processed",
      mode: "Bank Transfer",
    },
    {
      id: "WD-1991",
      date: "27 Apr 2026",
      amount: 680,
      status: "Under Review",
      mode: "Bank Transfer",
    },
  ];
  const pendingSettlement = 320;
  const totalWithdrawn = withdrawalHistory.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const availableToWithdraw = Math.max(4000 - pendingSettlement, 0);

  useEffect(() => {
    if (!searchParams) return;
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = window.setTimeout(() => {
      const query = search.trim();
      if (!query) {
        // Only sync empty search to "/" when already on the home page. On routes
        // like /category/[slug], an empty search must not navigate away.
        if (pathname === "/") {
          router.replace("/");
        }
        return;
      }
      router.replace(`/?q=${encodeURIComponent(query)}`);
    }, 400);

    return () => {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current);
      }
    };
  }, [search, router, pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropDown.current &&
        !profileDropDown.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) {
      router.push("/");
      return;
    }

    router.push(`/?q=${encodeURIComponent(query)}`);
    setSearchBarOpen(false);
  };

  const clearSearch = () => {
    setSearch("");
    router.replace("/");
  };

  const handleBankInputChange = (key: keyof IBankDetails, value: string) => {
    setBankDetails((prev) => ({ ...prev, [key]: value }));
  };

  const walletModal = walletOpen
    ? createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setWalletOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Wallet className="text-emerald-600" size={20} />
                    Wallet & Bank Withdrawals
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    UI preview mode - payout API integration will be added later.
                  </p>
                </div>
                <button
                  onClick={() => setWalletOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50 mb-6">
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      walletView === "overview"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setWalletView("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      walletView === "bank"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setWalletView("bank")}
                  >
                    Bank Account
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      walletView === "withdrawals"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setWalletView("withdrawals")}
                  >
                    Withdrawals
                  </button>
                </div>

                {walletView === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <p className="text-sm text-emerald-700 mb-2">
                        Available to Withdraw
                      </p>
                      <p className="text-3xl font-bold text-emerald-800">
                        ₹{availableToWithdraw}
                      </p>
                      <p className="text-xs text-emerald-700 mt-2">
                        Eligible balance after settlement hold.
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                      <p className="text-sm text-amber-700 mb-2">
                        Pending Settlement
                      </p>
                      <p className="text-3xl font-bold text-amber-800">
                        ₹{pendingSettlement}
                      </p>
                      <p className="text-xs text-amber-700 mt-2">
                        Auto-released in next payout cycle.
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-5">
                      <p className="text-sm text-violet-700 mb-2">Total Withdrawn</p>
                      <p className="text-3xl font-bold text-violet-800">
                        ₹{totalWithdrawn}
                      </p>
                      <p className="text-xs text-violet-700 mt-2">
                        Cumulative bank settlements.
                      </p>
                    </div>
                  </div>
                )}

                {walletView === "bank" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Holder Name
                        </label>
                        <input
                          value={bankDetails.accountHolderName}
                          onChange={(e) =>
                            handleBankInputChange("accountHolderName", e.target.value)
                          }
                          placeholder="Enter full name"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          value={bankDetails.bankName}
                          onChange={(e) =>
                            handleBankInputChange("bankName", e.target.value)
                          }
                          placeholder="Enter bank name"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Number
                        </label>
                        <input
                          value={bankDetails.accountNumber}
                          onChange={(e) =>
                            handleBankInputChange("accountNumber", e.target.value)
                          }
                          placeholder="Enter account number"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IFSC Code
                        </label>
                        <input
                          value={bankDetails.ifscCode}
                          onChange={(e) => handleBankInputChange("ifscCode", e.target.value)}
                          placeholder="e.g. SBIN0000123"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name
                      </label>
                      <input
                        value={bankDetails.branchName}
                        onChange={(e) => handleBankInputChange("branchName", e.target.value)}
                        placeholder="Enter branch"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Landmark size={15} className="text-emerald-600" />
                        Saved details will be used for bank payout requests.
                      </p>
                      <button
                        onClick={() => setBankSaved(true)}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
                      >
                        <BadgeCheck size={16} />
                        Save Bank Details
                      </button>
                    </div>
                    {bankSaved && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                        Bank account details saved (UI preview mode).
                      </div>
                    )}
                  </div>
                )}

                {walletView === "withdrawals" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Request Withdrawal
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Withdrawal Amount (INR)
                          </label>
                          <div className="relative">
                            <IndianRupee
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                            />
                            <input
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="Enter amount"
                              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            Available Balance:{" "}
                            <span className="font-semibold text-gray-900">
                              ₹{availableToWithdraw}
                            </span>
                          </p>
                          <p className="flex items-center gap-1 text-gray-500">
                            <Clock3 size={14} />
                            Settlement SLA: 24-48 working hours (planned).
                          </p>
                        </div>
                        <button
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-60"
                          disabled={!bankSaved}
                        >
                          Submit Withdrawal Request
                        </button>
                        {!bankSaved && (
                          <p className="text-xs text-amber-600">
                            Add and save bank details to enable withdrawals.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Withdrawal History
                      </h3>
                      <div className="space-y-3">
                        {withdrawalHistory.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-gray-100 p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.id}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.date} • {item.mode}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                ₹{item.amount}
                              </p>
                              <p
                                className={`text-xs ${
                                  item.status === "Processed"
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {item.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null;

  const sideBar = menuOpen
    ? createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100 }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className="fixed top-0 left-0 h-full w-[75%] sm:w-[60%] z-9999
              bg-linear-to-b from-green-800/90 via-green-700/80 to-green-900/90
              backdrop-blur-xl border-r border-green-400/20
              shadow-[0_0_50px_-10px_rgba(0,255,100,0.3)]
              flex flex-col p-6 text-white"
          >
            <div className="flex justify-between items-center mb-2">
              <h1 className="font-extrabold text-2xl tracking-wide text-white/90">
                Admin Panel
              </h1>
              <button
                className="text-white/80 hover:text-red-400 text-2xl font-bold transition"
                onClick={() => setMenuOpen(false)}
              >
                <X />
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 mt-3 rounded-xl bg-white/10 hover:bg-white/15 transition shadow-inner">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-400/60 shadow-lg">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt="user"
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <User />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {user.name}
                </h2>
                <p className="text-xs text-green-200 capitalize tracking-wide">
                  {user.role}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 font-medium mt-6">
              <Link
                href={"/profile"}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="w-5 h-5" /> Profile
              </Link>
              <Link
                href={"/admin/add-grocery"}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              >
                <PlusCircle className="w-5 h-5" /> Add Grocery
              </Link>
              <Link
                href={"/admin/view-grocery"}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              >
                <Boxes className="w-5 h-5" /> View Grocery
              </Link>
              <Link
                href={"/admin/manage-orders"}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              >
                <Clipboard className="w-5 h-5" /> Manage Orders
              </Link>
              <Link
                href={"/admin/moods"}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              >
                <Sparkles className="w-5 h-5" /> Shop by Mood
              </Link>
            </div>
            <div className="my-5 border-t border-white/20"></div>
            <div
              className="flex items-center gap-3 text-red-300 font-semibold mt-auto hover:bg-red-500/20 p-3 rounded-lg transition-all"
              onClick={async () => await signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-5 h-5 text-red-300" />
              Logout
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <div className="fixed inset-x-4 top-4 max-w-[1300px] mx-auto bg-linear-to-r from-green-500 to-green-700 rounded-2xl shadow-black/30 flex justify-between items-center h-20 px-4 md:px-8 z-50">
      <Link
        href={"/"}
        className="text-2xl font-extrabold text-white sm:text-3xl tracking-wide hover:scale-105 transition-transform"
      >
        Snapcart
      </Link>
      {user.role == "user" && (
        <form
          className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/2 max-w-lg shadow-md"
          onSubmit={handleSearch}
        >
          <Search className="text-gray-500 w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Search groceries..."
            className="w-full outline-none text-gray-700 placeholder-gray-400"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-700 transition ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      )}

      <div className="flex items-center gap-3 md:gap-6 relative">
        {user.role == "user" && (
          <>
            <div
              className="bg-white rounded-full w-11 h-11 items-center justify-center flex shadow-md hover:scale-105 transition md:hidden"
              onClick={() => setSearchBarOpen((prev) => !prev)}
            >
              <Search className="text-green-600 w-6 h-6" />
            </div>

            <Link
              href={"/user/cart"}
              className="relative bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md hover:scale-105 transition"
            >
              <ShoppingCartIcon className="text-green-600 w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold shadow">
                {cartData.length}
              </span>
            </Link>
          </>
        )}

        {user.role == "admin" && (
          <>
            <div className="hidden md:flex items-center gap-4">
              <Link
                href={"/admin/add-grocery"}
                className="flex items-center gap-2 bg-white text-green-700 font-semibold px-4 rounded-full hover:bg-green-100 transition-all"
              >
                <PlusCircle className="w-5 h-5" /> Add Grocery
              </Link>
              <Link
                href={"/admin/view-grocery"}
                className="flex items-center gap-2 bg-white text-green-700 font-semibold px-4 rounded-full hover:bg-green-100 transition-all"
              >
                <Boxes className="w-5 h-5" /> View Grocery
              </Link>
              <Link
                href={"/admin/manage-orders"}
                className="flex items-center gap-2 bg-white text-green-700 font-semibold px-4 rounded-full hover:bg-green-100 transition-all"
              >
                <Clipboard className="w-5 h-5" /> Manage Orders
              </Link>
              <Link
                href={"/admin/moods"}
                className="flex items-center gap-2 bg-white text-green-700 font-semibold px-4 rounded-full hover:bg-green-100 transition-all"
              >
                <Sparkles className="w-5 h-5" /> Shop by Mood
              </Link>
            </div>
            <div
              className="md:hidden bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Menu className="text-green-600 w-6 h-6" />
            </div>
          </>
        )}

        <div className="relative" ref={profileDropDown}>
          <div
            className="bg-white rounded-full w-11 h-11 flex items-center justify-center overflow-hidden shadow-md hover:scale-105 transition-transform"
            onClick={() => setOpen((prev) => !prev)}
          >
            {user.image ? (
              <Image
                src={user.image}
                alt="user"
                fill
                className="object-cover rounded-full"
              />
            ) : (
              <User />
            )}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-999"
              >
                <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center relative justify-center overflow-hidden">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="user"
                        fill
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <User />
                    )}
                  </div>
                  <div className="text-gray-800 font-semibold">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </div>
                </div>

                <Link
                  href={"/profile"}
                  className="flex items-center gap-2 px-3 py-3 mt-2 text-gray-700 rounded-lg hover:bg-green-50 font-medium"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="w-5 h-5 text-green-600" />
                  Edit Profile
                </Link>

                {user.role == "deliveryBoy" && (
                  <button
                    className="flex items-center gap-2 w-full text-left px-3 py-3 text-gray-700 rounded-lg hover:bg-green-50 font-medium"
                    onClick={() => {
                      setOpen(false);
                      setWalletOpen(true);
                    }}
                  >
                    <Wallet className="w-5 h-5 text-green-600" />
                    Wallet & Withdrawals
                  </button>
                )}

                {user.role == "user" && (
                  <Link
                    href={"/user/my-orders"}
                    className="flex items-center gap-2 px-3 py-3 text-gray-700 rounded-lg hover:bg-green-50 font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <Package className="w-5 h-5 text-green-600" />
                    My Orders
                  </Link>
                )}

                {user.role == "user" && (
                  <Link
                    href={"/user/repeat-orders"}
                    className="flex items-center gap-2 px-3 py-3 text-gray-700 rounded-lg hover:bg-green-50 font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <Repeat className="w-5 h-5 text-green-600" />
                    Repeat Orders
                  </Link>
                )}

                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-3 hover:bg-red-50 rounded-lg text-gray-700 font-medium"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {searchBarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bg-white rounded-full shadow-lg z-40 flex items-center px-4 py-2"
              >
                <Search className="text-gray-500 w-5 h-5 mr-2" />
                <form
                  className="grow flex items-center"
                  onSubmit={handleSearch}
                >
                  <input
                    type="text"
                    placeholder="search groceries..."
                    className="w-full outline-none text-gray-700"
                    onChange={(e) => setSearch(e.target.value)}
                    value={search}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="text-gray-400 hover:text-gray-700 transition ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>
                <button onClick={() => setSearchBarOpen(false)}>
                  <X className="text-gray-500 w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {sideBar}
      {walletModal}
    </div>
  );
}

export default Nav;
