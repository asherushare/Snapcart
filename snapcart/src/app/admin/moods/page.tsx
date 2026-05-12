"use client";

import axios from "axios";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Loader,
  PlusCircle,
  Search,
  Trash2,
  Pencil,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { SHOP_CATEGORIES } from "@/lib/categories";

type MoodDto = {
  _id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description?: string;
  image?: string;
  categoryNames?: string[];
  createdAt?: string;
};

const allCategories = SHOP_CATEGORIES.map((c) => c.name);

export default function AdminMoodsPage() {
  const [moods, setMoods] = useState<MoodDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<MoodDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return moods;
    return moods.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.subtitle || "").toLowerCase().includes(q),
    );
  }, [moods, search]);

  const fetchMoods = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/moods");
      setMoods(res.data?.moods || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  const openCreate = () => {
    setEditing({
      _id: "",
      slug: "",
      name: "",
      subtitle: "",
      description: "",
      image: "",
      categoryNames: [],
    });
  };

  const closeModal = () => setEditing(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        subtitle: editing.subtitle,
        description: editing.description,
        image: editing.image,
        categoryNames: editing.categoryNames || [],
      };

      if (editing._id) {
        await axios.put(`/api/admin/moods/${editing._id}`, payload);
      } else {
        await axios.post("/api/admin/moods", payload);
      }
      await fetchMoods();
      closeModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to save mood");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: MoodDto) => {
    if (!confirm(`Delete mood “${m.name}”?`)) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/moods/${m._id}`);
      await fetchMoods();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete mood");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 w-[95%] md:w-[84%] mx-auto">
      <div className="sticky top-3 z-30 mb-6 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm ring-1 ring-black/5 px-3 py-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-full transition w-full sm:w-auto"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <h1 className="text-2xl md:text-3xl font-extrabold text-green-700 flex items-center justify-center gap-2">
            <Sparkles size={28} className="text-green-600" />
            Shop by Mood
          </h1>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-full transition w-full sm:w-auto"
          >
            <PlusCircle size={18} />
            <span>Create mood</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all max-w-lg mx-auto w-full"
        >
          <Search className="text-gray-500 w-5 h-5 mr-2 shrink-0" />
          <input
            type="text"
            className="w-full min-w-0 outline-none text-gray-700 placeholder-gray-400"
            placeholder="Search moods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-700 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-gray-600 gap-2 mt-12">
          <Loader className="w-5 h-5 animate-spin" /> Loading moods...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-600 mt-12">
          No moods found. Create your first mood.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((m) => (
            <motion.div
              key={m._id}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {m.name}
                  </div>
                  {m.subtitle ? (
                    <div className="text-sm text-gray-600 mt-1">{m.subtitle}</div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(m.categoryNames || []).slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700"
                      >
                        {c}
                      </span>
                    ))}
                    {(m.categoryNames || []).length > 3 ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                        +{(m.categoryNames || []).length - 3} more
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition disabled:opacity-60"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-700">
                  {editing._id ? "Edit Mood" : "Create Mood"}
                </h2>
                <button
                  className="text-gray-600 hover:text-red-600"
                  onClick={closeModal}
                >
                  <X size={18} />
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 transition-all"
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      required
                      placeholder="Gym Mode"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 transition-all"
                    value={editing.subtitle || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, subtitle: e.target.value })
                    }
                    placeholder="High-protein essentials"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 transition-all min-h-24"
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    placeholder="Short description shown on mood page."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 transition-all"
                    value={editing.image || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, image: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Categories (multi-select)
                    </label>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200 p-3 max-h-56 overflow-y-auto">
                      {allCategories.map((c) => {
                        const checked = (editing.categoryNames || []).includes(c);
                        return (
                          <label
                            key={c}
                            className="flex items-center gap-3 text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(editing.categoryNames || []);
                                if (e.target.checked) next.add(c);
                                else next.delete(c);
                                setEditing({
                                  ...editing,
                                  categoryNames: Array.from(next),
                                });
                              }}
                            />
                            <span>{c}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 font-medium mt-1">
                      Moods are visible to users immediately after saving.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-60"
                  >
                    {saving ? <Loader size={16} className="animate-spin" /> : null}
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

