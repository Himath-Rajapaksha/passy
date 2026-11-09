// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "../../src/App";
import { estimateStrength } from "../../src/core/entropy";

vi.mock("../../src/core/entropy", () => ({
  estimateStrength: vi.fn(),
}));

const mockedEstimate = vi.mocked(estimateStrength);

beforeEach(() => {
  mockedEstimate.mockReset();
  mockedEstimate.mockResolvedValue({
    score: 1,
    label: "Very weak — memorable only",
    warning: true,
  });
});

it("shows the honest mnemonic warning and never says strong", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  expect(await screen.findByText(/very weak/i)).toBeInTheDocument();
  expect(screen.queryByText(/^strong$/i)).not.toBeInTheDocument();
});

it("waits for strength estimation before showing a label", async () => {
  let resolve: (value: {
    score: 2;
    label: string;
    warning: boolean;
  }) => void = () => {};
  mockedEstimate.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  expect(await screen.findByText(/estimating/i)).toBeInTheDocument();
  resolve({ score: 2, label: "Weak", warning: true });
  expect(await screen.findByText(/^weak$/i)).toBeInTheDocument();
});

it("shows an unavailable label when estimation fails", async () => {
  mockedEstimate.mockRejectedValue(new Error("chunk failed"));
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/phrase/i), "password");
  expect(await screen.findByText(/strength unavailable/i)).toBeInTheDocument();
});

it("keeps the memorable-not-strong warning visible", async () => {
  render(<App />);
  expect(
    screen.getByText(/memorable is not the same as strong/i),
  ).toBeInTheDocument();
});
