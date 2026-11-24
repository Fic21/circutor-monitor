
import { NextResponse } from "next/server";
import { getCircutorResource } from "@/lib/circutor/client";

const ALLOWED_RESOURCES = [
  "device-measures",
  "device-steps",
  "device-alarms",
  "device-info",
  "wifi",
  "bluetooth",
  "thingsboard",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  try {
    const { resource } = await params;

    if (!ALLOWED_RESOURCES.includes(resource)) {
      return NextResponse.json(
        { error: "Resource tidak diizinkan" },
        { status: 404 }
      );
    }

    const data = await getCircutorResource(resource);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    console.error("CIRCUTOR API:", message);

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
