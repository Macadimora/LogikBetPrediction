import { NextResponse } from "next/server";

import crypto from "crypto";

import {
  verifyAndActivateFlutterwavePayment,
} from "@/lib/flutterwave";

function secureCompare(
  received: string,
  expected: string
) {
  const receivedBuffer =
    Buffer.from(received);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}

export async function POST(
  request: Request
) {
  try {
    const secretHash =
      process.env.FLW_SECRET_HASH;

    if (!secretHash) {
      console.error(
        "FLW_SECRET_HASH is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Webhook is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Flutterwave v3 sends the configured
     * webhook secret hash in the
     * "verif-hash" header.
     */
    const signature =
      request.headers.get(
        "verif-hash"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    const signatureIsValid =
      secureCompare(
        signature,
        secretHash
      );

    if (!signatureIsValid) {
      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    let payload: {
      event?: string;
      data?: {
        id?: string | number;
        tx_ref?: string;
      };
    };

    try {
      payload =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid webhook payload.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payload.event !==
      "charge.completed"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const transactionId =
      payload.data?.id;

    const txRef =
      payload.data?.tx_ref;

    if (
      !transactionId ||
      !txRef
    ) {
      console.error(
        "Flutterwave webhook missing transaction information:",
        {
          transactionId,
          txRef,
        }
      );

      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const result =
      await verifyAndActivateFlutterwavePayment(
        String(transactionId),
        String(txRef)
      );

    if (!result.success) {
      console.error(
        "Flutterwave webhook activation failed:",
        result.error
      );

      /*
       * The webhook signature was valid and
       * the payment verification function
       * independently checked Flutterwave.
       *
       * Return 200 so Flutterwave does not
       * repeatedly send an event that cannot
       * be processed.
       */
      return NextResponse.json({
        received: true,
        processed: false,
        error: result.error,
      });
    }

    console.log(
      "Flutterwave webhook processed successfully:",
      {
        transactionId,
        txRef,
        alreadyProcessed:
          result.alreadyProcessed ??
          false,
      }
    );

    return NextResponse.json({
      received: true,
      processed: true,
      alreadyProcessed:
        result.alreadyProcessed ??
        false,
    });
  } catch (error) {
    console.error(
      "Flutterwave webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}
