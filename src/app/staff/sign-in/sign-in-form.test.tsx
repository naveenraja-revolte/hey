// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "@/app/staff/sign-in/sign-in-form";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("staff sign-in form", () => {
  it("posts credentials and opens shipment operations on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ email: "staff@example.com" }),
        } as Response),
    );
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(
      screen.getByLabelText("Work email (required)"),
      "staff@example.com",
    );
    await user.type(
      screen.getByLabelText("Password (required)"),
      "correct horse battery staple",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/staff/shipments"),
    );
  });

  it("shows a rejected sign-in response without navigating", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid email or password." }),
      } as Response),
    );
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(
      screen.getByLabelText("Work email (required)"),
      "staff@example.com",
    );
    await user.type(
      screen.getByLabelText("Password (required)"),
      "wrong password",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Invalid email or password.",
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
