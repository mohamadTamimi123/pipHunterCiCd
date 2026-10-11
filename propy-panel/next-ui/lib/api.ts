export const API_URL = process.env.API_PATH || "http://127.0.0.1:8084";

export const AUTH_COOKIE = "userAuth";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function setToken(token: string) {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearToken() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

type Options = { method?: string; body?: unknown; auth?: boolean };

export async function api<T = any>(path: string, { method = "GET", body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("ارتباط با سرور برقرار نشد", 0);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    if (res.status === 401 && auth && typeof window !== "undefined" && !path.startsWith("/auth/")) {
      clearToken();
      window.location.href = "/login";
    }
    const firstDetail = json?.details && Object.values(json.details).flat()[0];
    throw new ApiError((firstDetail as string) || json?.message || "خطایی رخ داد", res.status, json?.code, json?.details);
  }
  return json?.data as T;
}

export function decodeToken(token: string | null): { id: number; email: string; role: "user" | "support" | "admin"; fullName?: string } | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.user ?? null;
  } catch {
    return null;
  }
}
