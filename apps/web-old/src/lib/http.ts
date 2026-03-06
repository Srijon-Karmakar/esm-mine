const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type HttpOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data && ("message" in data || "error" in data))
        ? (Array.isArray((data as any).message) ? (data as any).message.join(", ") : (data as any).message) ||
          (data as any).error ||
          "Request failed"
        : "Request failed";
    throw new Error(msg);
  }

  return data as T;
}
