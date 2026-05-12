import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const name = (formData.get("name") as string | null)?.trim();
    const mobile = (formData.get("mobile") as string | null)?.trim();
    const vehicleType = (formData.get("vehicleType") as string | null)?.trim();
    const isOnlineRaw = formData.get("isOnline") as string | null;

    const addressLine1 = (formData.get("addressLine1") as string | null)?.trim();
    const addressLine2 = (formData.get("addressLine2") as string | null)?.trim();
    const addressLandmark = (formData.get("addressLandmark") as string | null)?.trim();
    const addressCity = (formData.get("addressCity") as string | null)?.trim();
    const addressPincode = (formData.get("addressPincode") as string | null)?.trim();

    const currentPassword = (formData.get("currentPassword") as string | null) ?? "";
    const newPassword = (formData.get("newPassword") as string | null) ?? "";

    const file = formData.get("image") as Blob | null;
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (typeof name === "string" && name.length > 0) updateData.name = name;
    if (typeof mobile === "string") updateData.mobile = mobile;

    updateData.address = {
      line1: addressLine1 ?? "",
      line2: addressLine2 ?? "",
      landmark: addressLandmark ?? "",
      city: addressCity ?? "",
      pincode: addressPincode ?? "",
    };

    if (user.role === "deliveryBoy") {
      if (typeof vehicleType === "string") updateData.vehicleType = vehicleType;
      if (typeof isOnlineRaw === "string") {
        updateData.isOnline = isOnlineRaw === "true";
      }
    }

    if (newPassword.trim()) {
      if (!user.password) {
        return NextResponse.json(
          { message: "Password change not available for this account." },
          { status: 400 },
        );
      }
      if (!currentPassword.trim()) {
        return NextResponse.json(
          { message: "Current password is required." },
          { status: 400 },
        );
      }
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { message: "New password must be at least 6 characters." },
          { status: 400 },
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { message: "Current password is incorrect." },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    if (file) {
      const imageUrl = await uploadOnCloudinary(file);
      if (imageUrl) updateData.image = imageUrl;
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .select("-password")
      .lean();

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `update profile error: ${error}` },
      { status: 500 },
    );
  }
}

