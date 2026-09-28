"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminAutoRefresherProps {
  intervalMs?: number;
}

export default function AdminAutoRefresher({ intervalMs = 10000 }: AdminAutoRefresherProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
