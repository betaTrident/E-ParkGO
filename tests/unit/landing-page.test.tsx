import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LandingPage } from "@/components/landing/landing-page";

vi.mock("@/components/shared/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Toggle theme</button>,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

describe("LandingPage", () => {
  it("presents the core product story and secure staff access", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /smarter parking from entry to exit/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /get started/i })[0],
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("heading", { name: /how e-parkgo works/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /parking management dashboard/i,
      }),
    ).toBeInTheDocument();
  });

  it("uses real in-page destinations for landing navigation", () => {
    render(<LandingPage />);

    expect(
      screen.getAllByRole("link", { name: "Features" })[0],
    ).toHaveAttribute("href", "#features");
    expect(
      screen.getAllByRole("link", { name: "How it works" })[0],
    ).toHaveAttribute("href", "#workflow");
    expect(screen.getAllByRole("link", { name: "Themes" })[0]).toHaveAttribute(
      "href",
      "#themes",
    );
  });
});
