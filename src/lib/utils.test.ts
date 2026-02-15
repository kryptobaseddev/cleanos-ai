import { describe, it, expect } from "vitest";
import { formatBytes, formatDate, getFileExtension, getCategoryColor } from "./utils";

describe("formatBytes", () => {
  it("returns '0 B' for 0", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("respects decimal places", () => {
    expect(formatBytes(1536, 1)).toBe("1.5 KB");
    expect(formatBytes(1536, 0)).toBe("2 KB");
  });
});

describe("formatDate", () => {
  it("formats a unix timestamp", () => {
    const result = formatDate(1700000000);
    expect(result).toContain("2023");
    expect(result).toContain("Nov");
  });
});

describe("getFileExtension", () => {
  it("returns the extension", () => {
    expect(getFileExtension("file.txt")).toBe("txt");
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("returns empty string for no extension", () => {
    expect(getFileExtension("Makefile")).toBe("");
  });
});

describe("getCategoryColor", () => {
  it("returns correct colors for known categories", () => {
    expect(getCategoryColor("document")).toBe("#3b82f6");
    expect(getCategoryColor("media")).toBe("#8b5cf6");
    expect(getCategoryColor("code")).toBe("#10b981");
  });

  it("returns fallback for unknown category", () => {
    expect(getCategoryColor("unknown")).toBe("#6b7280");
  });
});
