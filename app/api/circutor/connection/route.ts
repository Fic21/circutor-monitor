
import { NextResponse } from "next/server";
import {
  connectCircutor,
  disconnectCircutor,
  isCircutorConnected,
} from "@/lib/circutor/client";

// Memeriksa status koneksi.
export async function GET() {
  return NextResponse.json({
    connected: isCircutorConnected(),
  });
}

// Login ketika tombol Connect ditekan.
export async function POST() {
  try {
    await connectCircutor();

    return NextResponse.json({
      connected: true,
      message: "CIRCUTOR berhasil terhubung",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghubungkan CIRCUTOR";

    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 502 }
    );
  }
}

// Disconnect dan hapus token dari memori aplikasi.
export async function DELETE() {
  disconnectCircutor();

  return NextResponse.json({
    connected: false,
    message: "Koneksi CIRCUTOR diputus",
  });
}
