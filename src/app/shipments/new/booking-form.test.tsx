// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingForm } from "@/app/shipments/new/booking-form";

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

async function fillBookingForm() {
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText("Sender full name (required)"),
    "Morgan Lee",
  );
  await user.type(
    screen.getByLabelText("Sender email address (required)"),
    "morgan@example.com",
  );
  await user.type(
    screen.getByLabelText("Pickup address (required)"),
    "18 River Street, Portland, OR",
  );
  await user.type(
    screen.getByLabelText("Recipient full name (required)"),
    "Avery Chen",
  );
  await user.type(
    screen.getByLabelText("Delivery address (required)"),
    "42 Pine Avenue, Salem, OR",
  );
  await user.type(
    screen.getByLabelText("Parcel contents (required)"),
    "Books and stationery",
  );
  return user;
}

describe("parcel booking form", () => {
  it("submits shipment details and navigates to its tracking timeline", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ trackingNumber: "PD-ABCDEF0123456789ABCD" }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<BookingForm />);
    const user = await fillBookingForm();
    await user.click(screen.getByRole("button", { name: "Register parcel" }));

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        "/track/PD-ABCDEF0123456789ABCD?created=1",
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shipments",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("keeps entered values and shows server validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Check the highlighted shipment details.",
          fields: { senderName: ["Enter the sender's name."] },
        }),
      } as Response),
    );
    render(<BookingForm />);
    const user = await fillBookingForm();
    await user.click(screen.getByRole("button", { name: "Register parcel" }));

    expect(await screen.findByText("Enter the sender's name.")).toBeTruthy();
    expect(
      (screen.getByLabelText("Sender full name (required)") as HTMLInputElement)
        .value,
    ).toBe("Morgan Lee");
  });
});
