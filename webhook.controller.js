import crypto from "crypto";
import { asyncHandler } from "../../../utils/index.js";
import { Lesson, Payment, StudentProfile, TutorProfile, User, Availability } from "../../../models/index.js";

export const webhookHandler = asyncHandler(async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature first
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    const razorpaySignature = req.headers["x-razorpay-signature"];
    if (digest !== razorpaySignature) {
      console.log("❌ Invalid signature");
      return res.status(400).json({ status: "failure", message: "Invalid signature" });
    }

    // ✅ Immediately acknowledge webhook
    res.json({ status: "ok" });

    // Continue processing in background (don’t block response)
    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;

      if (payment.notes && payment.notes.type === "Demo Class Payment") {
        let paymentMethod = null;
        if (payment.method === "netbanking") paymentMethod = "Net Banking";
        else if (payment.method === "card") paymentMethod = "Card";
        else if (payment.method === "wallet") paymentMethod = "Wallet";
        else if (payment.method === "upi") paymentMethod = "UPI";
  
        const paymentData = await Payment.findOneAndUpdate(
          { orderId: payment.order_id },
          {
            paymentId: payment.id,
            status: "PAID",
            method: paymentMethod,
            date: new Date()
          },
          { new: true }
        );
  
        if (!paymentData) {
          console.error("⚠️ Payment record not found for order:", payment.order_id);
          return;
        }
  
        const lessonData = await Lesson.findByIdAndUpdate(paymentData.lesson, {
          $set: { status: "CONFIRMED", payment: paymentData._id }
        });
  
        const bookingDate = lessonData.date;
        const dayName = bookingDate.toLocaleDateString("en-US", { weekday: "short" });
  
        await Availability.findOneAndUpdate(
          {
            tutor: lessonData.tutor,
            day: dayName,
          },
          {
            $pull: { timeslots: lessonData.time }
          }
        );
  
        const studentProfile = await StudentProfile.findOne({ user: paymentData.payer });
  
        if (studentProfile) {
          studentProfile.demoLessons.push(paymentData.lesson);
          studentProfile.paymentHistory.push(paymentData._id);
          await studentProfile.save({ validateBeforeSave: false });
        } else {
          await StudentProfile.create({
            user: paymentData.payer,
            demoLessons: [paymentData.lesson],
            paymentHistory: [paymentData._id]
          });
          await User.findByIdAndUpdate(
            paymentData.payer,
            { $set: { role: "STUDENT" } }
          );
        }
  
        await TutorProfile.findByIdAndUpdate(
          lessonData.tutor,
          {
            $push: { demoLessons: lessonData._id }
          },
          { new: true }
        );  
      }

      if (payment.notes && payment.notes.type === "Tutor Payout") {
        let paymentMethod = null;
        if (payment.method === "netbanking") paymentMethod = "Net Banking";
        else if (payment.method === "card") paymentMethod = "Card";
        else if (payment.method === "wallet") paymentMethod = "Wallet";
        else if (payment.method === "upi") paymentMethod = "UPI";

        const paymentData = await Payment.findOneAndUpdate(
          { orderId: payment.order_id },
          {
            paymentId: payment.id,
            status: "PAID",
            date: new Date(),
            method: paymentMethod
          },
          { new: true }
        );

        if (!paymentData) {
          console.error("⚠️ Payment record not found for order:", payment.order_id);
          return;
        }

        await TutorProfile.findOneAndUpdate(
          { _id: payment.notes.tutorId },
          {
            paymentStatus: "Paid",
            $push: { paymentHistory: paymentData._id }
          },
          { new: true }
        );
      }

      console.log("✅ Payment successful:", payment.id);
    }

    else if (event === "payment.failed") {
      const payment = req.body.payload.payment.entity;

      if (payment.notes && payment.notes.type === "Demo Class Payment") {
        let paymentMethod = null;
        if (payment.method === "netbanking") paymentMethod = "Net Banking";
        else if (payment.method === "card") paymentMethod = "Card";
        else if (payment.method === "wallet") paymentMethod = "Wallet";
        else if (payment.method === "upi") paymentMethod = "UPI";
  
        const paymentData = await Payment.findOneAndUpdate(
          { orderId: payment.order_id },
          {
            paymentId: payment.id,
            status: "FAILED",
            method: paymentMethod,
          },
          { new: true }
        );
  
        const studentProfile = await StudentProfile.findOne({ user: paymentData.payer });
  
        if (studentProfile) {
          studentProfile.paymentHistory.push(paymentData._id);
          await studentProfile.save({ validateBeforeSave: false });
        }
      }

      if (payment.notes && payment.notes.type === "Tutor Payout") {
        let paymentMethod = null;
        if (payment.method === "netbanking") paymentMethod = "Net Banking";
        else if (payment.method === "card") paymentMethod = "Card";
        else if (payment.method === "wallet") paymentMethod = "Wallet";
        else if (payment.method === "upi") paymentMethod = "UPI";

        const paymentData = await Payment.findOneAndUpdate(
          { orderId: payment.order_id },
          {
            paymentId: payment.id,
            status: "FAILED",
            method: paymentMethod,
          },
          { new: true }
        );
        await TutorProfile.findOneAndUpdate(
          { _id: payment.notes.tutorId },
          {
            paymentStatus: "Failed",
            $push: { paymentHistory: paymentData._id }
          },
          { new: true }
        );
      }
      
      console.log("❌ Payment failed:", payment.id);
    }

  } catch (err) {
    console.error("Webhook Error:", err.message);
    // Don’t send a second res.json here since we already acknowledged
  }
});
