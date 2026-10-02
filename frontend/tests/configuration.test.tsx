import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "@/components/Providers";
import { CONFIGURATION_MESSAGE } from "@/lib/config";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("configuration guard", () => {
  it("shows the exact non-functional state without gameplay when deployment config is absent", () => {
    render(<Providers><button>Drop 10 PIGGY</button></Providers>);
    expect(screen.getByRole("status")).toHaveTextContent(CONFIGURATION_MESSAGE);
    expect(screen.queryByRole("button", { name: "Drop 10 PIGGY" })).not.toBeInTheDocument();
    expect(screen.queryByText(/PIGGY balance/i)).not.toBeInTheDocument();
  });
});
