import { describe, expect, it } from "vitest";
import { getInitialTheme } from "../theme/theme";

function mockStorage(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem: () => value
  };
}

describe("theme initialization", () => {
  it("returns light when light is stored", () => {
    expect(getInitialTheme(mockStorage("light"))).toBe("light");
  });

  it("returns dark when dark is stored", () => {
    expect(getInitialTheme(mockStorage("dark"))).toBe("dark");
  });

  it("defaults to dark when value is missing", () => {
    expect(getInitialTheme(mockStorage(null))).toBe("dark");
  });

  it("defaults to dark when value is invalid", () => {
    expect(getInitialTheme(mockStorage("unknown"))).toBe("dark");
  });
});
