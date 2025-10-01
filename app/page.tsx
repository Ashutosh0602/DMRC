"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import usePWAInstall from "@/hooks/usePWAInstall";
import InstallPrompt from "./components/InstallPrompt";

export default function HomePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  const { isInstallable, promptInstall, dismissInstall } = usePWAInstall();

  const startTracking = () => {
    const newUid = uuidv4();
    setUid(newUid);
    setTracking(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: newUid,
              lat: latitude,
              long: longitude,
            }),
          });
        },
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Geo Tracker</h1>

      {!tracking ? (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          onClick={startTracking}
        >
          Start Tracking
        </button>
      ) : (
        <p className="mt-4">Tracking started for UID: {uid}</p>
      )}

      {isInstallable && (
        <InstallPrompt
          onInstall={() => promptInstall()}
          onDismiss={() => dismissInstall()}
        />
      )}
    </div>
  );
}
