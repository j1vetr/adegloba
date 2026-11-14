import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Announcement } from "@shared/announcement";
import AnnouncementDialog from "@/components/announcements/AnnouncementDialog";
import { useUserAuth } from "@/hooks/useUserAuth";

interface AnnouncementResponse {
  announcement: Announcement | null;
}

function isEligibleCustomerPath(path: string) {
  const normalized = path.toLowerCase().split("?")[0];
  if (
    normalized.startsWith("/admin") ||
    ["/login", "/giris", "/kayit"].includes(normalized) ||
    normalized.startsWith("/sifre")
  ) return false;
  if (/(checkout|check-out|payment|odeme|order-success|order-cancel|success|cancel|canceled|cancelled)/i.test(normalized)) {
    return false;
  }
  return true;
}

export default function AnnouncementPopup() {
  const { user, isAuthenticated } = useUserAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dismissError, setDismissError] = useState<string | null>(null);
  const closedVersions = useRef(new Set<string>());
  const previousUserId = useRef<string | undefined>(undefined);
  const eligible = isAuthenticated && isEligibleCustomerPath(location);
  const userId = user?.id;
  const queryKey = useMemo(() => ["/api/user/announcement", userId], [userId]);

  const announcementQuery = useQuery<AnnouncementResponse>({
    queryKey,
    enabled: eligible && userId != null,
    queryFn: async () => {
      const response = await fetch("/api/user/announcement", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Duyuru bilgisi alınamadı.");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: eligible ? 60000 : false,
    refetchOnWindowFocus: true,
  });

  const announcement = eligible ? announcementQuery.data?.announcement ?? null : null;

  useEffect(() => {
    if (previousUserId.current !== userId) {
      closedVersions.current.clear();
      setOpen(false);
      if (previousUserId.current) {
        queryClient.removeQueries({ queryKey: ["/api/user/announcement", previousUserId.current], exact: true });
      }
      previousUserId.current = userId;
    }
  }, [userId, queryClient]);

  const dismissMutation = useMutation({
    mutationFn: async (version: string) => {
      const response = await fetch("/api/user/announcement/dismiss", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.message || "Duyuru kapatılamadı.") as Error & { status?: number };
        error.status = response.status;
        throw error;
      }
      return body as { success: true };
    },
    onSuccess: (_result, version) => {
      if (userId != null) closedVersions.current.add(`${userId}:${version}`);
      setDismissError(null);
      setOpen(false);
    },
    onError: (error: Error & { status?: number }) => {
      setDismissError(error.message || "Duyuru kapatılamadı. Lütfen yeniden deneyin.");
      if (error.status === 409) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  useEffect(() => {
    if (!eligible || !userId || !announcement) {
      setOpen(false);
      setDismissError(null);
      return;
    }
    const localKey = `${userId}:${announcement.version}`;
    const isScheduled =
      announcement.enabled &&
      (!announcement.startsAt || new Date(announcement.startsAt).getTime() <= Date.now()) &&
      (!announcement.endsAt || new Date(announcement.endsAt).getTime() > Date.now());
    setOpen(isScheduled && !closedVersions.current.has(localKey));
    setDismissError(null);
  }, [eligible, userId, announcement?.version, announcement?.enabled, announcement?.startsAt, announcement?.endsAt]);

  useEffect(() => {
    if (!open || !announcement?.endsAt) return;
    const expiresAt = new Date(announcement.endsAt).getTime();
    let timer: number;
    const checkExpiry = () => {
      const delay = expiresAt - Date.now();
      if (delay <= 0) setOpen(false);
      else timer = window.setTimeout(checkExpiry, Math.min(delay, 2147483647));
    };
    checkExpiry();
    return () => window.clearTimeout(timer);
  }, [open, announcement?.endsAt]);

  if (!eligible || !announcement) return null;

  return (
    <AnnouncementDialog
      announcement={announcement}
      open={open}
      onOpenChange={setOpen}
      onDismiss={() => dismissMutation.mutate(announcement.version)}
      dismissPending={dismissMutation.isPending}
      dismissError={dismissError}
    />
  );
}
