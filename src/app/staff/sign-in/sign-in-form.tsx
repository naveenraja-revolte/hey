"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/form-fields";

export function SignInForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/staff/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Sign in was not successful. Try again.");
        return;
      }
      router.replace("/staff/shipments");
      router.refresh();
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={signIn} className="grid gap-6">
      {error && (
        <p
          className="rounded-control bg-destructive/10 text-destructive p-3"
          role="alert"
        >
          {error}
        </p>
      )}
      <TextField
        id="email"
        name="email"
        label="Work email (required)"
        type="email"
        autoComplete="username"
        required
      />
      <TextField
        id="password"
        name="password"
        label="Password (required)"
        type="password"
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-12 px-5 font-semibold transition hover:opacity-90 focus-visible:outline-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
