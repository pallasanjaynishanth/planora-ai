import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { EventForm } from "./EventForm";
import { eventFixture } from "../../test/fixtures";
it("submits validated event data", async () => {
  const onSubmit = vi.fn();
  render(<EventForm initial={eventFixture()} onSubmit={onSubmit} />);
  await userEvent.click(screen.getByRole("button", { name: "Create my plan" }));
  expect(onSubmit).toHaveBeenCalledWith(eventFixture());
});
it("rejects invalid guests and focuses the accessible field", async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<EventForm initial={eventFixture()} onSubmit={onSubmit} />);
  const field = screen.getByLabelText("Number of guests");
  await user.clear(field);
  await user.type(field, "0");
  await user.click(screen.getByRole("button", { name: "Create my plan" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(field).toHaveAttribute("aria-invalid", "true");
  expect(field).toHaveFocus();
  expect(screen.getByRole("alert")).toBeVisible();
});
it("validates zero budgets without invoking generation", async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<EventForm initial={eventFixture()} onSubmit={onSubmit} />);
  await user.clear(screen.getByLabelText("Total budget"));
  await user.type(screen.getByLabelText("Total budget"), "0");
  await user.click(screen.getByRole("button", { name: "Create my plan" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Budget must be greater than zero.")).toBeVisible();
});
