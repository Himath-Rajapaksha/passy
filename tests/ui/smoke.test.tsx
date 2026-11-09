// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import App from "../../src/App";

it("renders the Passy heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /passy/i })).toBeInTheDocument();
});
