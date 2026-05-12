"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { AnimatePresence, motion } from "motion/react";
import { Loader, Upload, User as UserIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUserData } from "@/redux/userSlice";
import { AppDispatch } from "@/redux/store";

type Role = "user" | "deliveryBoy" | "admin";

type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: Role;
  image?: string;
  isOnline?: boolean;
  vehicleType?: string;
  address?: {
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
  };
};

export default function ProfileEditor({ user }: { user: ProfileUser }) {
  const dispatch = useDispatch<AppDispatch>();

  const initial = useMemo(
    () => ({
      name: user.name ?? "",
      mobile: user.mobile ?? "",
      addressLine1: user.address?.line1 ?? "",
      addressLine2: user.address?.line2 ?? "",
      addressLandmark: user.address?.landmark ?? "",
      addressCity: user.address?.city ?? "",
      addressPincode: user.address?.pincode ?? "",
      vehicleType: user.vehicleType ?? "",
      isOnline: Boolean(user.isOnline),
    }),
    [user],
  );

  const [form, setForm] = useState(initial);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image ?? null);
  const [savedUser, setSavedUser] = useState<ProfileUser>(user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    // When server-provided user changes (route refresh, etc.), sync UI.
    setSavedUser(user);
    setForm(initial);
    setImagePreview(user.image ?? null);
  }, [user, initial]);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("error", "Name is required.");
      return;
    }
    if (newPassword.trim() || confirmPassword.trim() || currentPassword.trim()) {
      if (newPassword.trim().length < 6) {
        showToast("error", "New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast("error", "New password and confirm password do not match.");
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("mobile", form.mobile.trim());
      fd.append("addressLine1", form.addressLine1.trim());
      fd.append("addressLine2", form.addressLine2.trim());
      fd.append("addressLandmark", form.addressLandmark.trim());
      fd.append("addressCity", form.addressCity.trim());
      fd.append("addressPincode", form.addressPincode.trim());

      if (user.role === "deliveryBoy") {
        fd.append("vehicleType", form.vehicleType.trim());
        fd.append("isOnline", String(form.isOnline));
      }

      if (currentPassword.trim()) fd.append("currentPassword", currentPassword);
      if (newPassword.trim()) fd.append("newPassword", newPassword);

      if (imageFile) fd.append("image", imageFile);

      const res = await axios.post("/api/profile/update", fd);
      const updated = res?.data?.user as ProfileUser | undefined;
      if (!updated?._id) {
        throw new Error("Profile update response was invalid.");
      }

      // Re-fetch canonical user (avoids any serialization quirks and guarantees
      // the UI reflects what's actually stored).
      const me = await axios.get("/api/me");
      const canonical = (me?.data?.user as ProfileUser | undefined) ?? updated;

      dispatch(setUserData(canonical));
      setSavedUser(canonical);
      setForm({
        name: canonical.name ?? "",
        mobile: canonical.mobile ?? "",
        addressLine1: canonical.address?.line1 ?? "",
        addressLine2: canonical.address?.line2 ?? "",
        addressLandmark: canonical.address?.landmark ?? "",
        addressCity: canonical.address?.city ?? "",
        addressPincode: canonical.address?.pincode ?? "",
        vehicleType: canonical.vehicleType ?? "",
        isOnline: Boolean(canonical.isOnline),
      });
      setImagePreview(canonical.image ?? imagePreview);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setImageFile(null);
      showToast("success", "Profile updated.");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-[95%] md:w-[84%] mx-auto pt-6 pb-14">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-700">Edit Profile</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Update your basic information. Email and role are read-only.
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-full sm:w-48">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-green-50 ring-1 ring-black/5 shadow-sm mx-auto sm:mx-0">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="profile" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-700">
                      <UserIcon className="w-10 h-10" />
                    </div>
                  )}
                  <label
                    htmlFor="profileImage"
                    className="absolute inset-0 bg-black/35 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    aria-label="Upload profile photo"
                  >
                    <Upload className="w-7 h-7 text-white" />
                  </label>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center sm:text-left mt-3">
                  Click the photo to change.
                </p>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Full name</label>
                  <input
                    value={form.name}
                    onChange={onChange("name")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input
                    value={user.email}
                    disabled
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Role</label>
                  <input
                    value={user.role}
                    disabled
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 capitalize"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Mobile</label>
                  <input
                    value={form.mobile}
                    onChange={onChange("mobile")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Mobile number"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 ring-1 ring-black/5">
              <h2 className="text-lg font-bold text-green-800">Saved address</h2>
              <p className="text-sm text-gray-600 mt-1">
                {[
                  savedUser.address?.line1,
                  savedUser.address?.line2,
                  savedUser.address?.landmark,
                  savedUser.address?.city,
                  savedUser.address?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") || "No address saved yet."}
              </p>
            </div>

            <div className="bg-green-50/60 rounded-2xl p-5 ring-1 ring-black/5">
              <h2 className="text-lg font-bold text-green-800">Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Address line 1</label>
                  <input
                    value={form.addressLine1}
                    onChange={onChange("addressLine1")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="House/flat, street"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Address line 2</label>
                  <input
                    value={form.addressLine2}
                    onChange={onChange("addressLine2")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Area, locality (optional)"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Landmark</label>
                  <input
                    value={form.addressLandmark}
                    onChange={onChange("addressLandmark")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nearby landmark (optional)"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <input
                    value={form.addressCity}
                    onChange={onChange("addressCity")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Pincode</label>
                  <input
                    value={form.addressPincode}
                    onChange={onChange("addressPincode")}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>

            {user.role === "deliveryBoy" && (
              <div className="bg-white rounded-2xl p-5 ring-1 ring-black/5">
                <h2 className="text-lg font-bold text-green-800">Delivery settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Vehicle type</label>
                    <input
                      value={form.vehicleType}
                      onChange={onChange("vehicleType")}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Bike, scooter, etc."
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isOnline}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, isOnline: e.target.checked }))
                        }
                        className="w-5 h-5 accent-green-600"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Available / Online
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 ring-1 ring-black/5">
              <h2 className="text-lg font-bold text-green-800">Change password</h2>
              <p className="text-sm text-gray-600 mt-1">
                Optional. Leave blank if you don’t want to change it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Current</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Current password"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">New</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="New password"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Confirm</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-green-600 text-white px-8 py-3 font-semibold hover:bg-green-700 disabled:opacity-60 transition"
              >
                {saving ? <Loader className="w-5 h-5 animate-spin" /> : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`flex items-center gap-2 rounded-full px-5 py-3 shadow-lg ring-1 ring-black/5 ${
                toast.type === "success"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

