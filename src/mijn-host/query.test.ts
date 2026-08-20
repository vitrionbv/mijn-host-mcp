import { describe, expect, it } from "vitest";
import { appendQueryParams, compactQuery } from "./query.js";

describe("appendQueryParams", () => {
  it("appends query string to path", () => {
    expect(appendQueryParams("/domains", { tags: "a,b" })).toBe("/domains?tags=a%2Cb");
  });

  it("returns path unchanged when query is empty", () => {
    expect(appendQueryParams("/domains", {})).toBe("/domains");
  });

  it("skips undefined values", () => {
    expect(appendQueryParams("/domains", { tags: undefined, page: 1 })).toBe(
      "/domains?page=1",
    );
  });
});

describe("compactQuery", () => {
  it("drops undefined entries", () => {
    expect(compactQuery({ page: 1, limit: undefined })).toEqual({ page: 1 });
  });
});
