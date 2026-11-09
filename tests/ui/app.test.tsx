// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "../../src/App";
import { generatePassword } from "../../src/core/generate";

vi.mock("../../src/core/generate", () => ({
  generatePassword: vi.fn(),
}));

const mockedGenerate = vi.mocked(generatePassword);
const mockResult = {
  ok: true as const,
  password: "p@$$w0rd-9K#mT7x",
  classes: {
    lowercase: true,
    uppercase: true,
    digit: true,
    symbol: true,
  },
  length: 16,
  notices: [],
};

beforeEach(() => {
  mockedGenerate.mockReset();
  mockedGenerate.mockResolvedValue(mockResult);
});

it("shows output after typing and clears it when the phrase is cleared", async () => {
  const user = userEvent.setup();
  render(<App />);
  const input = screen.getByLabelText(/phrase you'll remember/i);
  await user.type(input, "password");
  expect(
    await screen.findByText("p@$$w0rd-9K#mT7x", {}, { timeout: 1500 }),
  ).toBeInTheDocument();
  await user.clear(input);
  expect(screen.queryByText("p@$$w0rd-9K#mT7x")).not.toBeInTheDocument();
});
it("disables copy while a fresh password is deriving", async () => {
  let resolve!: (value: typeof mockResult) => void;
  mockedGenerate.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase you'll remember/i), "password");
  const copy = screen.getByRole("button", { name: /copy password/i });
  await waitFor(() => expect(mockedGenerate).toHaveBeenCalled());
  expect(copy).toBeDisabled();
  resolve(mockResult);
  await waitFor(() => expect(copy).toBeEnabled());
});
it("copies the password on user action", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  await screen.findByText("p@$$w0rd-9K#mT7x");
  await user.click(screen.getByRole("button", { name: /copy/i }));
  expect(writeText).toHaveBeenCalledWith("p@$$w0rd-9K#mT7x");
});
it("announces the copy politely instead of announcing every keystroke", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  await screen.findByText("p@$$w0rd-9K#mT7x");
  await user.click(screen.getByRole("button", { name: /copy/i }));
  expect(screen.getByText(/^password copied/i)).toHaveAttribute(
    "aria-live",
    "polite",
  );
});
it("shows the persistent memorable-not-strong warning", () => {
  render(<App />);
  expect(
    screen.getByText(/memorable is not the same as strong/i),
  ).toBeInTheDocument();
});
it("shows the empty helper before a phrase is typed", () => {
  render(<App />);
  expect(screen.getByText(/start typing a phrase/i)).toBeInTheDocument();
});
it("can hide and show the password", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  await screen.findByText("p@$$w0rd-9K#mT7x");
  await user.click(screen.getByRole("button", { name: /^hide$/i }));
  expect(screen.queryByText("p@$$w0rd-9K#mT7x")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /^show$/i }));
  expect(screen.getByText("p@$$w0rd-9K#mT7x")).toBeInTheDocument();
});
it("shows class chips with text labels", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  await screen.findByText("p@$$w0rd-9K#mT7x");
  for (const label of ["lowercase", "uppercase", "digit", "symbol"]) {
    expect(screen.getByText(new RegExp(label, "i"))).toBeInTheDocument();
  }
});
