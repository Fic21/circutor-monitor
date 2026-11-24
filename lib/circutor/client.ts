
type LoginResponse = {
  Token?: string;
};

const BASE_URL = process.env.CIRCUTOR_BASE_URL;
const USERNAME = process.env.CIRCUTOR_USERNAME;
const PASSWORD = process.env.CIRCUTOR_PASSWORD;

let cachedToken: string | null = null;
let loginPromise: Promise<string> | null = null;

function getConfig() {
  if (!BASE_URL || !USERNAME || !PASSWORD) {
    throw new Error("Konfigurasi CIRCUTOR di .env.local belum lengkap");
  }

  return {
    baseUrl: BASE_URL.replace(/\/$/, ""),
    username: USERNAME,
    password: PASSWORD,
  };
}

async function login(): Promise<string> {
  const config = getConfig();

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
    throw new Error(`Login CIRCUTOR gagal: HTTP ${response.status}`);
  }

  const result = (await response.json()) as LoginResponse;

  if (!result.Token) {
    throw new Error("Token tidak ditemukan pada respons login CIRCUTOR");
  }

  cachedToken = result.Token;

  return cachedToken;
}

async function getToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  if (!loginPromise) {
    loginPromise = login().finally(() => {
      loginPromise = null;
    });
  }

  return loginPromise;
}

export async function getCircutorResource<T>(
  resource: string
): Promise<T> {
  const config = getConfig();

  if (!/^[a-z0-9-]+$/i.test(resource)) {
    throw new Error("Nama resource tidak valid");
  }

  const endpoint = `${config.baseUrl}/api/v1/${resource}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken();

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 401 && attempt === 0) {
      cachedToken = null;
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `CIRCUTOR ${resource} gagal: HTTP ${response.status}`
      );
    }

    return (await response.json()) as T;
  }

  throw new Error("Autentikasi CIRCUTOR gagal setelah login ulang");
}
