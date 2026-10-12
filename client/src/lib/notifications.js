import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "./api";

export const notificationsKey = ["notifications"];

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: notificationsKey,
    queryFn: ({ pageParam }) => api.notifications(pageParam),
    initialPageParam: null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled,
    staleTime: 15000,
    refetchInterval: enabled ? 30000 : false,
    refetchOnWindowFocus: true
  });
}
