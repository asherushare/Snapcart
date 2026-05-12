import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const {orderId, otp} = await req.json();
        if(!orderId || !otp) return NextResponse.json({message: "orderId and otp not found"}, {status: 400});

        const order = await Order.findById(orderId);

        if(!order) return NextResponse.json({message: "Order not found"}, {status: 400});

        if(order.deliveryOtp !== otp) return NextResponse.json({message: "Invalid OTP"}, {status: 400});

        order.status = "delivered"
        order.deliveryOtpVerification = true
        order.deliveredAt = new Date()
        await order.save();

        await emitEventHandler("order-status-update", {orderId: order._id, status: order.status});

        await DeliveryAssignment.updateOne({order: orderId}, {$set: {assignedTo: null, status: "completed"}});

        return NextResponse.json({message: "Delivery completed successfully"}, {status: 200});

    } catch(err) {
        console.error(err);
        return NextResponse.json({message: `Verify OTP error ${err}`}, {status: 500});
    }
}