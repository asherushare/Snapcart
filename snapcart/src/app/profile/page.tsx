import { auth } from "@/auth";
import Footer from "@/components/Footer";
import GeoUpdater from "@/components/GeoUpdater";
import Nav from "@/components/Nav";
import ProfileEditor from "@/components/ProfileEditor";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProfilePage() {
  await connectDb();
  const session = await auth();
  const user = await User.findById(session?.user?.id).select("-password");
  if (!user) redirect("/login");

  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <>
      <Nav user={plainUser} />
      <GeoUpdater userId={plainUser._id} />
      <ProfileEditor user={plainUser} />
      <Footer />
    </>
  );
}

