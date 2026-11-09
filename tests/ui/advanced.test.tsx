// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "../../src/App";
import { generatePassword } from "../../src/core/generate";

vi.mock("../../src/core/generate", () => ({
  generatePassword: vi.fn(),
}));

const mockedGenerate = vi.mocked(generatePassword);

beforeEach(() => {
  mockedGenerate.mockReset();
  mockedGenerate.mockResolvedValue({
    ok: true,
    password: "p@$$w0rd-9K#mT7x",
    classes: { lowercase: true, uppercase: true, digit: true, symbol: true },
    length: 16,
    notices: [],
  });
});

it("passes site, secret, length, separator, and mode to generation", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase you'll remember/i), "password");
  await user.type(screen.getByLabelText(/site or app/i), "forum");
  await user.click(screen.getByRole("button", { name: /advanced/i }));
  await user.type(screen.getByLabelText(/extra secret/i), "Blue Fox");
  await waitFor(() =>
    expect(mockedGenerate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        site: "forum",
        secret: "Blue Fox",
        minLength: 16,
        separator: "-",
        mode: "reproducible",
      }),
    ),
  );
});
it("warns when the site tag is empty", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  expect(await screen.findByText(/add a site name/i)).toBeInTheDocument();
});
it("labels session-random as not reproducible", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /advanced/i }));
  await user.click(screen.getByLabelText(/session-random/i));
  expect(screen.getByText(/not reproducible/i)).toBeInTheDocument();
});
it("keeps the session-random warning visible after collapsing advanced", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /advanced/i }));
  await user.click(screen.getByLabelText(/session-random/i));
  await user.click(screen.getByRole("button", { name: /advanced/i }));
  expect(
    screen.getByText(/reloading the page gives a different one/i),
  ).toBeInTheDocument();
});
it("clamps the minimum length and passes separator changes", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  await user.click(screen.getByRole("button", { name: /advanced/i }));
  const slider = screen.getByLabelText(/minimum length/i);
  fireEvent.change(slider, { target: { value: "40" } });
  expect(slider).toHaveValue("32");
  await user.selectOptions(screen.getByLabelText(/separator/i), "_");
  await waitFor(() =>
    expect(mockedGenerate).toHaveBeenLastCalledWith(
      expect.objectContaining({ minLength: 32, separator: "_" }),
    ),
  );
});
it("shows and hides the extra secret", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /advanced/i }));
  const secret = screen.getByLabelText(/extra secret/i);
  expect(secret).toHaveAttribute("type", "password");
  await user.click(screen.getByRole("button", { name: /show secret/i }));
  expect(secret).toHaveAttribute("type", "text");
});
