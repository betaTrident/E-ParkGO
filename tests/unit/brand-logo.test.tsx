import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandLogo } from "@/components/shared/brand-logo";

describe("BrandLogo", () => {
  it("renders the supplied E-ParkGO mark with an accessible name", () => {
    render(<BrandLogo />);

    expect(screen.getByRole("img", { name: "E-ParkGO" })).toBeInTheDocument();
    expect(screen.queryByText("E-Park")).not.toBeInTheDocument();
  });

  it("can render a compact icon without duplicate visible wordmark text", () => {
    render(<BrandLogo compact />);

    expect(screen.getByRole("img", { name: "E-ParkGO" })).toBeInTheDocument();
    expect(screen.queryByText("E-Park")).not.toBeInTheDocument();
  });
});
