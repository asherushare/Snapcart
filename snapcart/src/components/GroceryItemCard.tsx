"use client";
import mongoose from "mongoose";
import React from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, AlertCircle, Clock, Repeat } from "lucide-react";
import { AppDispatch } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQuantity,
  increaseQuantity,
} from "@/redux/cartSlice";
import axios from "axios";

const getExpiryStatus = (expiryDate?: string | Date) => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) {
    return {
      status: "invalid",
      daysLeft: 0,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    };
  }
  const today = new Date();
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysLeft < 0)
    return {
      status: "expired",
      daysLeft: 0,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  if (daysLeft === 0)
    return {
      status: "today",
      daysLeft: 0,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  if (daysLeft <= 3)
    return {
      status: "critical",
      daysLeft,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  if (daysLeft <= 7)
    return {
      status: "warning",
      daysLeft,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    };
  return {
    status: "safe",
    daysLeft,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  };
};
interface IGrocery {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  category: string;
  price: string;
  unit: string;
  image: string;
  expiryDate?: string | Date;
  createdAt?: Date;
  updatedAt?: Date;
}

function GroceryItemCard({ item }: { item: IGrocery }) {
  const dispatch = useDispatch<AppDispatch>();

  const { cartData } = useSelector((state: any) => state.cart);
  const { userData } = useSelector((state: any) => state.user);
  const cartItem = cartData.find(
    (i: any) => String(i._id) === String(item._id),
  );

  const [repeatOpen, setRepeatOpen] = React.useState(false);
  const [repeatFrequency, setRepeatFrequency] = React.useState<"weekly" | "monthly">(
    "weekly",
  );
  const [repeatQty, setRepeatQty] = React.useState<number>(1);
  const [repeatSaving, setRepeatSaving] = React.useState(false);

  const saveRepeat = async () => {
    if (!userData?._id) {
      alert("Please login to enable repeat order.");
      return;
    }
    setRepeatSaving(true);
    try {
      await axios.post("/api/user/repeat-orders", {
        groceryId: String(item._id),
        quantity: repeatQty,
        frequency: repeatFrequency,
      });
      setRepeatOpen(false);
      alert("Repeat order enabled.");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Failed to enable repeat order");
    } finally {
      setRepeatSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false, amount: 0.3 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
    >
      <div className="relative w-full aspect-4/3 bg-gray-50 overflow-hidden group">
        <Image
          src={item.image}
          fill
          alt={item.name}
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-gray-500 font-medium mb-1">{item.category}</p>
        <h3>{item.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {item.unit}
          </span>
          <span className="text-green-700 font-bold text-lg">
            ₹{item.price}
          </span>
        </div>
        {item.expiryDate ? (
          (() => {
            const expiryStatus = getExpiryStatus(item.expiryDate);
            if (!expiryStatus) return null;

            const formattedDate = isNaN(new Date(item.expiryDate).getTime())
              ? "Invalid date"
              : new Date(item.expiryDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
            const statusText =
              expiryStatus.status === "expired"
                ? "Expired"
                : expiryStatus.status === "today"
                  ? "Expires Today!"
                  : expiryStatus.status === "critical"
                    ? `Expires in ${expiryStatus.daysLeft} day${expiryStatus.daysLeft > 1 ? "s" : ""}`
                    : expiryStatus.status === "invalid"
                      ? "Invalid expiry date"
                      : `Expires in ${expiryStatus.daysLeft} days`;

            return (
              <div
                className={`mt-3 p-2 rounded-lg border ${expiryStatus.bgColor} ${expiryStatus.borderColor}`}
              >
                <div className="flex items-center gap-1.5">
                  {expiryStatus.status === "expired" ? (
                    <AlertCircle size={14} className={expiryStatus.color} />
                  ) : (
                    <Clock size={14} className={expiryStatus.color} />
                  )}
                  <p className={`text-xs font-semibold ${expiryStatus.color}`}>
                    {statusText}
                  </p>
                </div>
                <p className={`text-xs ${expiryStatus.color} mt-1`}>
                  {formattedDate}
                </p>
              </div>
            );
          })()
        ) : (
          <div className="mt-3 p-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500">
            Expiry date not set
          </div>
        )}

        {!cartItem ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full py-2.5 text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            onClick={() => dispatch(addToCart({ ...item, quantity: 1 }))}
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex items-center justify-center bg-green-50 border border-green-200 rounded-full py-2.5 px-4 gap-4 shadow-sm"
          >
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-green-200 hover:bg-green-100 transition-all"
              onClick={() => dispatch(decreaseQuantity(String(item._id)))}
            >
              <Minus size={16} className="text-green-700" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {cartItem.quantity}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-green-200 hover:bg-green-100 transition-all"
              onClick={() => dispatch(increaseQuantity(String(item._id)))}
            >
              <Plus size={16} className="text-green-700" />
            </button>
          </motion.div>
        )}

        <button
          type="button"
          onClick={() => setRepeatOpen(true)}
          className="mt-3 inline-flex items-center justify-center gap-2 w-full rounded-full border border-green-200 bg-white text-green-700 py-2 text-sm font-semibold hover:bg-green-50 transition"
        >
          <Repeat className="w-4 h-4" />
          Repeat Order
        </button>
      </div>

      {repeatOpen ? (
        <div className="fixed inset-0 z-9999 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-gray-900">Repeat Order</div>
                <div className="text-sm text-gray-600 mt-1">
                  {item.name} • Cash on Delivery
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRepeatOpen(false)}
                className="text-gray-500 hover:text-gray-900"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={repeatFrequency}
                  onChange={(e) =>
                    setRepeatFrequency(e.target.value === "monthly" ? "monthly" : "weekly")
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-green-400 transition-all bg-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Next order will be placed automatically after 7/30 days.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={repeatQty}
                  onChange={(e) => setRepeatQty(Number(e.target.value || 1))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-green-400 transition-all"
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              We’ll send you a reminder ~24 hours before the order is placed.
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRepeatOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={repeatSaving}
                onClick={saveRepeat}
                className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition font-semibold disabled:opacity-60"
              >
                {repeatSaving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

export default GroceryItemCard;
