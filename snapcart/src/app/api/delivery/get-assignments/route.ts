import { auth } from "@/auth";
import connectDb from "@/lib/db";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import { NextResponse } from "next/server";

export async function GET() {
    try {
       await connectDb();
       const session = await auth()
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: session?.user?.id,
            status: "brodcasted"
        }).populate("order")
        return NextResponse.json(
            assignments, {status: 200}
        )
    } catch(err) {
        return NextResponse.json(
            {message: `get assignments error ${err}`},
            {status: 500}
        )
    }
}