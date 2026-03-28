import fs from "fs";
import path from "path";

export interface AppConfig {
  cookie: string;
  cookieUpdatedAt: string;
  port: number;
  storeName: string;
  storeFullName: string;
}

const DEFAULT_CONFIG: AppConfig = {
  cookie: "",
  cookieUpdatedAt: "",
  port: 4927,
  storeName: "斑马侠散酒铺",
  storeFullName: "斑马侠合肥肥东吾悦广场店",
};

const CONFIG_PATH = path.join(process.cwd(), "config.json");

export function readConfig(filePath: string = CONFIG_PATH): AppConfig {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(
  config: AppConfig,
  filePath: string = CONFIG_PATH
): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}
