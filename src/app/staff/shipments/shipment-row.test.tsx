// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipmentRow } from "@/app/staff/shipments/shipment-row";

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

describe("shipment operations row", () => {
  it("records the selected status and optional note", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ shipment: {} }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <div
        className="max-w-full overflow-x-auto"
        role="region"
        aria-label="Shipment table, horizontally scrollable"
        tabIndex={0}
      >
        <table>
          <caption className="sr-only">
            Shipment status update for Avery Chen
          </caption>
          <tbody>
            <ShipmentRow
              shipment={{
                id: "shipment-1",
                trackingNumber: "PD-ROW0000000000000001",
                senderName: "Morgan Lee",
                recipientName: "Avery Chen",
                recipientAddress: "42 Pine Avenue, Salem, OR",
                status: "booked",
                createdAt: "2026-01-02T12:00:00.000Z",
              }}
            />
          </tbody>
        </table>
      </div>,
    );
    await user.selectOptions(
      screen.getByLabelText("Next status for PD-ROW0000000000000001"),
      "collected",
    );
    await user.type(
      screen.getByLabelText(
        "Update note for PD-ROW0000000000000001 (optional)",
      ),
      "Collected from sender",
    );
    await user.click(screen.getByRole("button", { name: "Save update" }));

    await waitFor(() => expect(navigation.refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/shipments/PD-ROW0000000000000001",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          status: "collected",
          note: "Collected from sender",
        }),
      }),
    );
  });
});
