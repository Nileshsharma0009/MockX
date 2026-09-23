import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCorsOptions,
  getAppEnvironment,
  isOriginAllowed,
  parseAllowedOrigins,
  startWebsitePing,
} from "../src/config/runtimeConfig.js";

test("development CORS permits configured origins and local frontend ports", () => {
  const config = {
    appEnvironment: "development",
    allowedOrigins: parseAllowedOrigins(" https://dev.mockx.test, http://localhost:5173 "),
  };

  assert.equal(isOriginAllowed("https://dev.mockx.test", config), true);
  assert.equal(isOriginAllowed("http://localhost:4173", config), true);
  assert.equal(isOriginAllowed("https://other.mockx.test", config), false);
});

test("staging and production CORS require exact configured origins", () => {
  for (const appEnvironment of ["staging", "production"]) {
    const config = { appEnvironment, allowedOrigins: ["https://app.mockx.test"] };
    assert.equal(isOriginAllowed("https://app.mockx.test", config), true);
    assert.equal(isOriginAllowed("http://localhost:5173", config), false);
    assert.equal(isOriginAllowed("https://other.mockx.test", config), false);
  }
});

test("non-development environments must declare allowed origins", () => {
  assert.throws(
    () => createCorsOptions({ APP_ENV: "staging", NODE_ENV: "production", ALLOWED_ORIGINS: "" }),
    /ALLOWED_ORIGINS must be configured for staging/
  );
});

test("APP_ENV distinguishes staging from production Node runtime mode", () => {
  assert.equal(getAppEnvironment({ APP_ENV: "staging", NODE_ENV: "production" }), "staging");
  assert.equal(getAppEnvironment({ NODE_ENV: "production" }), "production");
  assert.equal(getAppEnvironment({ NODE_ENV: "development" }), "development");
});

test("website ping is disabled unless WEBSITE_URL is explicitly configured", () => {
  let scheduled = false;
  const timer = startWebsitePing({}, {
    schedule() {
      scheduled = true;
    },
  });

  assert.equal(timer, null);
  assert.equal(scheduled, false);
});

test("configured website ping uses the configured URL and interval", async () => {
  let callback;
  let scheduledInterval;
  let requestedUrl;
  let unreferenced = false;
  const timer = {
    unref() {
      unreferenced = true;
    },
  };

  const result = startWebsitePing(
    { WEBSITE_URL: "https://site.mockx.test", RELOAD_INTERVAL: "12000" },
    {
      request(url) {
        requestedUrl = url;
      },
      schedule(fn, interval) {
        callback = fn;
        scheduledInterval = interval;
        return timer;
      },
    }
  );

  assert.equal(result, timer);
  assert.equal(scheduledInterval, 12000);
  assert.equal(unreferenced, true);
  callback();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requestedUrl, "https://site.mockx.test");
});