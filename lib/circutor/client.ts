
type LoginResponse = {
  Token?: string;
};

type CircutorSession = {
  token: string | null;
  loginPromise: Promise<string> | null;
  version: number;
};

const BASE_URL = process.env.CIRCUTOR_BASE_URL;
const USERNAME = process.env.CIRCUTOR_USERNAME;
const PASSWORD = process.env.CIRCUTOR_PASSWORD;

// ==========================================
// GLOBAL SESSION
// ==========================================

const globalForCircutor = globalThis as typeof globalThis & {
  __circutorSession?: CircutorSession;
};

const session: CircutorSession =
  (globalForCircutor.__circutorSession ??= {
    token: null,
    loginPromise: null,
    version: 0,
  });

// ==========================================
// CONFIGURATION
// ==========================================

function getConfig() {
  if (!BASE_URL || !USERNAME || !PASSWORD) {
    throw new Error(
      "Konfigurasi CIRCUTOR di .env.local belum lengkap"
    );
  }

  return {
    baseUrl: BASE_URL.replace(/\/$/, ""),
    username: USERNAME,
    password: PASSWORD,
  };
}

// ==========================================
// LOGIN
// ==========================================

async function login(): Promise<string> {
  const config = getConfig();
  const currentVersion = session.version;

  const response = await fetch(
    `${config.baseUrl}/api/v1/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Login CIRCUTOR gagal: HTTP ${response.status}`
    );
  }

  const result = (await response.json()) as LoginResponse;

  if (!result.Token) {
    throw new Error(
      "Token tidak ditemukan pada respons login CIRCUTOR"
    );
  }

  // Cegah token tersimpan jika Disconnect
  // dilakukan saat proses login berlangsung.
  if (currentVersion !== session.version) {
    throw new Error("Proses koneksi dibatalkan");
  }

  session.token = result.Token;

  return result.Token;
}

// ==========================================
// CONNECT
// ==========================================

export async function connectCircutor(): Promise<void> {
  // Sudah terhubung.
  if (session.token) {
    return;
  }

  // Hindari login ganda.
  if (!session.loginPromise) {
    const request = login();

    session.loginPromise = request.finally(() => {
      if (session.loginPromise === wrappedRequest) {
        session.loginPromise = null;
      }
    });

    const wrappedRequest = session.loginPromise;
  }

  await session.loginPromise;
}

// ==========================================
// DISCONNECT
// ==========================================

export function disconnectCircutor(): void {
  // Membatalkan hasil request yang masih berjalan.
  session.version += 1;

  // Menghapus sesi aplikasi.
  session.token = null;
  session.loginPromise = null;
}

// ==========================================
// CONNECTION STATUS
// ==========================================

export function isCircutorConnected(): boolean {
  return session.token !== null;
}

// ==========================================
// GET DEVICE RESOURCE
// ==========================================

export async function getCircutorResource<T>(
  resource: string
): Promise<T> {
  const config = getConfig();

  if (!/^[a-z0-9-]+$/i.test(resource)) {
    throw new Error("Nama resource tidak valid");
  }

  // Tidak boleh login otomatis.
  if (!session.token) {
    throw new Error(
      "CIRCUTOR belum terhubung. Tekan Connect terlebih dahulu."
    );
  }

  const token = session.token;
  const currentVersion = session.version;

  const endpoint = `${config.baseUrl}/api/v1/${resource}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  // Periksa apakah Disconnect terjadi
  // ketika request sedang berjalan.
  if (currentVersion !== session.version) {
    throw new Error("Koneksi CIRCUTOR telah diputus");
  }

  // Token kedaluwarsa.
  if (response.status === 401) {
    if (session.token === token) {
      session.token = null;
    }

    throw new Error(
      "Sesi CIRCUTOR kedaluwarsa. Silakan Connect ulang."
    );
  }

  if (!response.ok) {
    throw new Error(
      `CIRCUTOR ${resource} gagal: HTTP ${response.status}`
    );
  }

  return (await response.json()) as T;
}
