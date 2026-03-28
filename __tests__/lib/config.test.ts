import { readConfig, writeConfig, type AppConfig } from "@/lib/config";
import fs from "fs";
import path from "path";

const TEST_CONFIG_PATH = path.join(__dirname, "test-config.json");

beforeEach(() => {
  if (fs.existsSync(TEST_CONFIG_PATH)) fs.unlinkSync(TEST_CONFIG_PATH);
});

afterAll(() => {
  if (fs.existsSync(TEST_CONFIG_PATH)) fs.unlinkSync(TEST_CONFIG_PATH);
});

describe("config", () => {
  test("readConfig returns defaults when file does not exist", () => {
    const config = readConfig("/nonexistent/path.json");
    expect(config.cookie).toBe("");
    expect(config.port).toBe(4927);
    expect(config.storeName).toBe("斑马侠散酒铺");
  });

  test("writeConfig then readConfig round-trips", () => {
    const config: AppConfig = {
      cookie: "test_cookie_abc",
      cookieUpdatedAt: "2026-03-28T22:00:00+08:00",
      port: 4927,
      storeName: "斑马侠散酒铺",
      storeFullName: "斑马侠合肥肥东吾悦广场店",
    };
    writeConfig(config, TEST_CONFIG_PATH);
    const loaded = readConfig(TEST_CONFIG_PATH);
    expect(loaded).toEqual(config);
  });
});
