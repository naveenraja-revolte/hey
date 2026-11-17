"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/staff/sign-out", { method: "POST" });
      if (!response.ok)
        throw new Error("Sign out could not be completed. Try again.");
      router.replace("/staff/sign-in");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Sign out could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid justify-items-end gap-1">
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="rounded-control border-border text-foreground hover:bg-muted focus-visible:outline-ring min-h-11 border px-4 font-medium transition focus-visible:outline-2 disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
