import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAndActivateFlutterwavePayment } from "@/lib/flutterwave";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const status = url.searchParams.get("status");
    const txRef = url.searchParams.get("tx_ref");
    const transactionId = url.searchParams.get("transaction_id");

    if (!txRef) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=failed", request.url)
      );
    }

    const payment = await prisma.payment.findUnique({
      where: {
        reference: txRef,
      },
    });

    if (!payment || payment.provider !== "FLUTTERWAVE") {
      return NextResponse.redirect(
        new URL("/dashboard?payment=failed", request.url)
      );
    }

    if (
      payment.status === "SUCCESS" &&
      payment.subscriptionId
    ) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=success", request.url)
      );
    }

    if (status !== "successful" || !transactionId) {
      if (payment.status === "PENDING") {
        await prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "FAILED",
          },
        });
      }

      return NextResponse.redirect(
        new URL("/dashboard?payment=failed", request.url)
      );
    }

    const result =
      await verifyAndActivateFlutterwavePayment(
        transactionId,
        txRef
      );

    if (!result.success) {
      console.error(
        "Flutterwave callback activation failed:",
        result.error
      );

      return NextResponse.redirect(
        new URL("/dashboard?payment=failed", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard?payment=success", request.url)
    );
  } catch (error) {
    console.error(
      "Flutterwave callback error:",
      error
    );

    return NextResponse.redirect(
      new URL("/dashboard?payment=failed", request.url)
    );
  }
}
