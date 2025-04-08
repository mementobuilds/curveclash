import { QueryClient } from "@tanstack/react-query";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    },
  },
});

// Helper function to handle API responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.message || `API error: ${res.status} ${res.statusText}`
    );
  }
  return res;
}

// Utility function for making API requests
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  
  return throwIfResNotOk(res);
}

// Create a query function with error handling
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: string[] }): Promise<T | null> => {
    try {
      const [url] = queryKey;
      const res = await apiRequest(url);
      
      if (res.status === 204) {
        return null;
      }
      
      return await res.json();
    } catch (err) {
      // If we get a 401, handle according to options
      if (
        err instanceof Error &&
        err.message.includes("401") &&
        options.on401 === "returnNull"
      ) {
        return null;
      }
      throw err;
    }
  };
};