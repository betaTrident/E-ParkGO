import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/actions", () => ({
  signInAction: vi.fn(async () => ({ error: null })),
}));

import { LoginForm } from "@/features/auth/components/login-form";

describe("LoginForm", () => {
  it("provides recovery navigation and an accessible password visibility control", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("preserves a requested local destination for server-side validation", () => {
    const { container } = render(
      <LoginForm nextPath="/sessions?status=active" />,
    );

    expect(container.querySelector('input[name="next"]')).toHaveValue(
      "/sessions?status=active",
    );
  });
});
