"use client";
import dynamic from "next/dynamic";
import { getSocket } from "@/lib/socket";
import { RootState } from "@/redux/store";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });
import DeliveryChat from "./DeliveryChat";
import { Loader, TrendingUp, Award, Zap } from "lucide-react";
import {
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ILocation {
  latitude: number;
  longitude: number;
}

function DeliveryBoyDashboard({ earning }: { earning: number }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const { userData } = useSelector((state: RootState) => state.user);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [todayEarning, setTodayEarning] = useState(earning || 0);
  const [weeklyEarning, setWeeklyEarning] = useState(0);
  const [totalEarning, setTotalEarning] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0,
  });
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0,
  });

  const fetchAssignments = async () => {
    try {
      const result = await axios.get("/api/delivery/get-assignments");

      setAssignments(result.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchEarningsData = async () => {
    try {
      const result = await axios.get("/api/delivery/earnings-summary");
      setTodayEarning(result.data?.todayEarning ?? earning ?? 0);
      setWeeklyEarning(result.data?.weekEarning ?? 0);
      setTotalEarning(result.data?.totalEarning ?? 0);
      setTotalDeliveries(result.data?.totalDeliveries ?? 0);
      setEarningsData(result.data?.dailyBreakdown || []);
      if (!result.data?.dailyBreakdown) {
        setEarningsData([
          { day: "Mon", earnings: 0 },
          { day: "Tue", earnings: 0 },
          { day: "Wed", earnings: 0 },
          { day: "Thu", earnings: 0 },
          { day: "Fri", earnings: 0 },
          { day: "Sat", earnings: 0 },
          { day: "Sun", earnings: earning || 0 },
        ]);
      }
    } catch (err) {
      console.log(err);
      setTodayEarning(earning || 0);
      setEarningsData([
        { day: "Mon", earnings: 0 },
        { day: "Tue", earnings: 0 },
        { day: "Wed", earnings: 0 },
        { day: "Thu", earnings: 0 },
        { day: "Fri", earnings: 0 },
        { day: "Sat", earnings: 0 },
        { day: "Sun", earnings: earning || 0 },
      ]);
    }
  };

  useEffect(() => {
    const socket = getSocket();

    if (!userData?._id) return;
    if (!navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setDeliveryBoyLocation({
          latitude: lat,
          longitude: lon,
        });
        socket.emit("update-location", {
          userId: userData?._id,
          latitude: lat,
          longitude: lon,
        });
      },
      (err) => {
        console.log(err);
      },
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [userData?._id]);

  useEffect((): any => {
    const socket = getSocket();
    const handleNewAssignment = (deliveryAssignment: any) => {
      setAssignments((prev) => [...prev, deliveryAssignment]);
    };
    const handleOrderStatusUpdate = ({ status }: any) => {
      if (status === "delivered" || status === "out for delivery") {
        fetchEarningsData();
        fetchCurrentOrder();
        fetchAssignments();
      }
    };

    socket.on("new-assignment", handleNewAssignment);
    socket.on("order-status-update", handleOrderStatusUpdate);
    return () => {
      socket.off("new-assignment", handleNewAssignment);
      socket.off("order-status-update", handleOrderStatusUpdate);
    };
  }, [userData]);

  const handleAccept = async (id: string) => {
    try {
      await axios.get(`/api/delivery/assignment/${id}/accept-assignment`);
      await fetchCurrentOrder();
      await fetchAssignments();
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCurrentOrder = async () => {
    try {
      const result = await axios.get("/api/delivery/current-order");
      if (result.data.active) {
        setActiveOrder(result.data.assignment);
        setUserLocation({
          latitude: result.data.assignment.order.address.latitude,
          longitude: result.data.assignment.order.address.longitude,
        });
      } else {
        setActiveOrder(null);
        setUserLocation({ latitude: 0, longitude: 0 });
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect((): any => {
    const socket = getSocket();
    const handleDeliveryLocation = ({ userId, location }: any) => {
      setDeliveryBoyLocation({
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      });
    };
    socket.on("update-deliveryBoy-location", handleDeliveryLocation);
    return () =>
      socket.off("update-deliveryBoy-location", handleDeliveryLocation);
  }, []);

  useEffect(() => {
    fetchCurrentOrder();
    fetchAssignments();
    fetchEarningsData();
  }, [userData]);

  const sendOtp = async () => {
    setSendOtpLoading(true);
    try {
      const result = await axios.post("/api/delivery/otp/send", {
        orderId: activeOrder.order._id,
      });
      console.log(result.data);
      setShowOtpBox(true);
      setSendOtpLoading(false);
    } catch (err) {
      console.log(err);
      setSendOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      const result = await axios.post("/api/delivery/otp/verify", {
        orderId: activeOrder.order._id,
        otp,
      });
      console.log(result.data);
      setActiveOrder(null);
      setVerifyOtpLoading(false);
      setShowOtpBox(false);
      await fetchCurrentOrder();
      await fetchEarningsData();
      await fetchAssignments();
    } catch (err) {
      setOtpError("OTP verification error.");
      setVerifyOtpLoading(false);
    }
  };

  if (!activeOrder && assignments.length === 0) {
    return (
      <div className="min-h-screen pt-32 md:pt-36 bg-gradient-to-br from-gray-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Earnings Dashboard 📊
            </h1>
            <p className="text-gray-600">Stay online to receive new orders</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Today's Earnings */}
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold opacity-90">
                  Today's Earning
                </h3>
                <div className="bg-white/20 p-3 rounded-full">
                  <Zap size={24} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">₹{todayEarning}</p>
              <p className="text-sm opacity-80">
                {Math.round(todayEarning / 40)} deliveries
              </p>
            </div>

            {/* This Week's Earnings */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold opacity-90">This Week</h3>
                <div className="bg-white/20 p-3 rounded-full">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">₹{weeklyEarning}</p>
              <p className="text-sm opacity-80">
                +{Math.round(weeklyEarning / 40)} deliveries
              </p>
            </div>

            {/* All-Time Earnings */}
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold opacity-90">All Time</h3>
                <div className="bg-white/20 p-3 rounded-full">
                  <Award size={24} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">₹{totalEarning}</p>
              <p className="text-sm opacity-80">
                {totalDeliveries} total deliveries
              </p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-8 w-full overflow-x-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              This Week's Performance
            </h2>
            <div className="w-full h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => `₹${Number(value).toFixed(0)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: "#22c55e", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Avg. Earning/Day</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{weeklyEarning > 0 ? (weeklyEarning / 7).toFixed(0) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Avg. Per Delivery</span>
                  <span className="text-2xl font-bold text-blue-600">₹40</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Deliveries</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {totalDeliveries}
                  </span>
                </div>
              </div>
            </div>

            {/* Motivation Card */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg p-6 border border-orange-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🎯 Your Goal
              </h3>
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-2">
                  Today's Target: ₹500
                </p>
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((earning / 500) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm mt-2">
                  <span className="font-bold text-orange-600">
                    {Math.round((todayEarning / 500) * 100)}%
                  </span>
                  <span className="text-gray-600"> - Keep going! 💪</span>
                </p>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mt-8 flex justify-center">
            <button
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Earnings
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (activeOrder && userLocation) {
    return (
      <div className="p-4 pt-32 md:pt-36 min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-green-700 mb-2">
            Active Delivery
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            order#{activeOrder.order._id.slice(-6)}
          </p>
          <div className="rounded-xl border shadow-lg overflow-hidden mb-6">
            <LiveMap
              userLocation={userLocation}
              deliveryBoyLocation={deliveryBoyLocation}
            />
          </div>
          <DeliveryChat
            orderId={activeOrder.order._id}
            deliveryBoyId={userData?._id?.toString()!}
          />

          <div className="mt-6 bg-white rounded-xl border shadow p-6">
            {!activeOrder.order.deliveryOtpVerification && !showOtpBox && (
              <button
                className="w-full py-4 text-center bg-green-600 text-white rounded-lg"
                onClick={sendOtp}
              >
                {sendOtpLoading ? (
                  <Loader
                    size={20}
                    className="animate-spin text-white text-center"
                  />
                ) : (
                  "Mark as Delivered"
                )}
              </button>
            )}
            {showOtpBox && (
              <div className="mt-4">
                <input
                  type="text"
                  className="w-full py-3 border rounded-lg text-center"
                  placeholder="Enter OTP"
                  maxLength={4}
                  onChange={(e) => setOtp(e.target.value)}
                  value={otp}
                />
                <button
                  className="w-full mt-4 text-center bg-blue-600 text-white py-3 rounded-lg"
                  onClick={verifyOtp}
                >
                  {verifyOtpLoading ? (
                    <Loader
                      size={20}
                      className="animate-spin text-white text-center"
                    />
                  ) : (
                    "Verify OTP"
                  )}
                </button>
                {otpError && (
                  <div className="text-red-600 text-center mt-2">
                    {otpError}
                  </div>
                )}
              </div>
            )}
            {activeOrder.order.deliveryOtpVerification && (
              <div className="text-green-700 text-center font-bold">
                Delivery Completed!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-32 md:pt-36 bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mt-30 mb-7.5">
          Delivery Assignments
        </h2>
        {assignments.map((a, index) => (
          <div
            key={index}
            className="p-5 bg-white rounded-xl shadow mb-4 border"
          >
            <p>
              <b>Order Id</b> #{a?.order._id?.slice(-6)}
            </p>
            <p className="text-gray-600">{a?.order?.address?.fullAddress}</p>

            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 bg-green-600 text-white py-2 rounded-lg"
                onClick={() => handleAccept(a._id)}
              >
                Accept
              </button>
              <button className="flex-1 bg-red-600 text-white py-2 rounded-lg">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeliveryBoyDashboard;
