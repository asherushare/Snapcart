"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { getSocket } from "@/lib/socket";

type Repeat = {
  _id: string;
  quantity: number;
  frequency: "weekly" | "monthly";
  status: "active" | "paused";
  nextRunAt: string;
  grocery: {
    _id: string;
    name: string;
    price: string;
    unit: string;
    image: string;
    category: string;
  };
};

export default function RepeatOrdersPage() {
  const [repeats, setRepeats] = useState<Repeat[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/user/repeat-orders");
      setRepeats(res.data?.repeats || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      load();
    };
    socket.on("repeat-orders-updated", handler);
    return () => {
      socket.off("repeat-orders-updated", handler);
    };
  }, []);

  const update = async (id: string, patch: Partial<Repeat>) => {
    await axios.put(`/api/user/repeat-orders/${id}`, patch);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Cancel this repeat order?")) return;
    await axios.delete(`/api/user/repeat-orders/${id}`);
    await load();
  };

  return (
    <div className="pt-24 pb-20 w-[92%] md:w-[80%] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-full transition"
        >
          <ArrowLeft size={18} />
          Back
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-green-700">
          My Repeat Orders
        </h1>
        <div />
      </div>

      {loading ? (
        <div className="text-gray-600 text-center">Loading…</div>
      ) : repeats.length === 0 ? (
        <div className="text-gray-600 text-center">
          No repeat orders yet. Open a product and click “Repeat Order”.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {repeats.map((r) => {
            const next = new Date(r.nextRunAt);
            return (
              <div
                key={r._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold text-gray-900 truncate">
                      {r.grocery?.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Qty: <b>{r.quantity}</b> • {r.frequency} •{" "}
                      <span
                        className={
                          r.status === "active" ? "text-green-700" : "text-gray-600"
                        }
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Next: <b>{isNaN(next.getTime()) ? "-" : next.toLocaleString("en-IN")}</b>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Orders are placed automatically as Cash on Delivery.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => update(r._id, { status: "paused" as any })}
                        className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100 transition"
                      >
                        <PauseCircle size={16} />
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => update(r._id, { status: "active" as any })}
                        className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                      >
                        <PlayCircle size={16} />
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(r._id)}
                      className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition"
                    >
                      <Trash2 size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

