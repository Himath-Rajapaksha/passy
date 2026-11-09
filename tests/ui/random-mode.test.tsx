// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "../../src/App";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

it("generates a random password in random mode", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: /random/i }));
  const output = await screen.findByTestId("random-output");
  expect(output.textContent).toMatch(
    /^[A-Za-z0-9!@#$%^&*()\-_=+?.]{20}$/,
  );
});

it("prevents disabling the last random character class", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: /random/i }));
  await screen.findByTestId("random-output");
  await user.click(screen.getByLabelText(/lowercase/i));
  await user.click(screen.getByLabelText(/uppercase/i));
  await user.click(screen.getByLabelText(/digits/i));
  expect(screen.getByLabelText(/symbols/i)).toBeDisabled();
});

it("regenerates when the random length changes", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: /random/i }));
  const output = await screen.findByTestId("random-output");
  expect(output.textContent).toHaveLength(20);
  fireEvent.change(screen.getByLabelText(/random length/i), {
    target: { value: "32" },
  });
  await waitFor(() => expect(output.textContent).toHaveLength(32));
});

it("copies the random password on user action", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(<App />);
  await user.click(screen.getByRole("tab", { name: /random/i }));
  const output = await screen.findByTestId("random-output");
  await user.click(screen.getByRole("button", { name: /copy/i }));
  expect(writeText).toHaveBeenCalledWith(output.textContent);
});

it("keeps the phrase flow available after switching back", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: /random/i }));
  await user.click(screen.getByRole("tab", { name: /phrase/i }));
  expect(screen.getByLabelText(/phrase you'll remember/i)).toBeInTheDocument();
});
