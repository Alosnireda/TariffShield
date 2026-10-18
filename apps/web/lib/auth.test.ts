import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getToken, getUser, isAuthenticated } from "./auth";

const originalWindow = (globalThis as { window?: unknown }).window;

afterEach(() => {
  if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
  else (globalThis as { window?: unknown }).window = originalWindow;
});

describe("auth storage safety", () => {
  it("returns null and false when window is unavailable during SSR", () => {
    delete (globalThis as { window?: unknown }).window;

    assert.equal(getToken(), null);
    assert.equal(getUser(), null);
    assert.equal(isAuthenticated(), false);
  });

  it("returns null for malformed user JSON instead of throwing", () => {
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => key === "tariffshield_user" ? "{not json" : null,
      },
    };

    assert.equal(getUser(), null);
  });

  it("reads valid sessions and returns null when the user key is absent", () => {
    const user = { id: "user-1", email: "user@example.com", role: "importer" as const };
    const values = new Map([
      ["tariffshield_token", "token-1"],
      ["tariffshield_user", JSON.stringify(user)],
    ]);
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
      },
    };

    assert.equal(getToken(), "token-1");
    assert.deepEqual(getUser(), user);
    assert.equal(isAuthenticated(), true);
    values.delete("tariffshield_user");
    assert.equal(getUser(), null);
  });
});