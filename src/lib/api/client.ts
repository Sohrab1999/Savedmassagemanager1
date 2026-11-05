// Thin fetch wrapper: typed errors, JSON handling.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "network-error");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON body */
  }

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      `request-failed-${response.status}`;
    throw new ApiError(response.status, message);
  }
  return data as T;
}
