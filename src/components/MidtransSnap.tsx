"use client";

import { useEffect } from "react";

// Add global interface for window.snap
declare global {
  interface Window {
    snap: any;
  }
}

interface MidtransSnapProps {
  clientKey: string;
}

export default function MidtransSnap({ clientKey }: MidtransSnapProps) {
  useEffect(() => {
    // Load Midtrans Snap JS dynamically
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const myMidtransClientKey = clientKey; // usually from process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

    let scriptTag = document.getElementById("midtrans-script");
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "midtrans-script";
      scriptTag.setAttribute("src", snapScriptUrl);
      scriptTag.setAttribute("data-client-key", myMidtransClientKey);
      document.body.appendChild(scriptTag);
    }

    return () => {
      // Optional: Cleanup script if component unmounts, but usually we leave it
    };
  }, [clientKey]);

  return null; // This component doesn't render anything visible
}
