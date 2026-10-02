import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClaimsPanel } from "@/components/ClaimsPanel";
import { AppShell } from "@/components/AppShell";
import { addSessionActivity, createSessionActivity, readSessionActivity, formatCountdown } from "@/lib/format";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("claims and accessible responsive shell", () => {
  it("disables empty claims and invokes the separate pull-claim action", async () => {
    const onClaim = vi.fn();
    const user = userEvent.setup();
    render(<ClaimsPanel slot={BigInt(0)} previous={BigInt(125)} prize={BigInt(0)} busy={false} onClaim={onClaim} />);
    const buttons = screen.getAllByRole("button", { name: "Claim" });
    expect(buttons[0]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
    await user.click(buttons[1]);
    expect(onClaim).toHaveBeenCalledWith("claim-previous");
  });

  it("provides keyboard navigation and visible focus styling", async () => {
    const user = userEvent.setup();
    render(<AppShell><h1>Keyboard test content</h1></AppShell>);
    await user.tab();
    expect(screen.getByRole("link", { name: "SquidPot home" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Play" })).toHaveFocus();
    const css = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 3px solid");
  });

  it("includes a 360px responsive breakpoint and minimum touch size", () => {
    const css = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
    expect(css).toContain("@media (max-width: 460px)");
    expect(css).toContain("min-height: 46px");
    expect(css).toContain("width: min(100% - 24px");
  });

  it("recovers only observed request IDs from session activity for contract re-reads", () => {
    const entry = createSessionActivity({
      id: "0xtransaction:play", action: "play", hash: "0xtransaction", requestId: "42", status: "CONFIRMED",
    });
    addSessionActivity(entry);
    expect(readSessionActivity()).toEqual([expect.objectContaining({ requestId: "42", action: "play" })]);
    expect(readSessionActivity()[0]).not.toHaveProperty("reward");
    expect(readSessionActivity()[0]).not.toHaveProperty("balance");
  });

  it("derives countdown only from a deadline and a confirmed chain timestamp", () => {
    expect(formatCountdown(BigInt(0), BigInt(100))).toBeNull();
    expect(formatCountdown(BigInt(220), BigInt(100))).toBe("02:00");
    expect(formatCountdown(BigInt(100), BigInt(100))).toBe("00:00");
    expect(formatCountdown(BigInt(120), undefined)).toBeNull();
  });
});
