import { saveReport, listReports, getReport } from "@/lib/reports";
import fs from "fs";
import path from "path";
import type { StoredReport } from "@/services/youzan/types";

const TEST_REPORTS_DIR = path.join(__dirname, "test-reports");

beforeEach(() => {
  fs.rmSync(TEST_REPORTS_DIR, { recursive: true, force: true });
});

afterAll(() => {
  fs.rmSync(TEST_REPORTS_DIR, { recursive: true, force: true });
});

describe("reports", () => {
  test("saveReport creates file in correct directory structure", () => {
    const report: StoredReport = {
      id: "2026-03-27-claude",
      date: "2026-03-27",
      source: "claude",
      createdAt: "2026-03-27T22:00:00+08:00",
      title: "3月27日日报",
      content: "今日营收1370.14元...",
    };

    saveReport(report, TEST_REPORTS_DIR);

    const filePath = path.join(TEST_REPORTS_DIR, "2026", "03", "2026-03-27-claude.md");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("getReport reads saved report", () => {
    const report: StoredReport = {
      id: "2026-03-27-claude",
      date: "2026-03-27",
      source: "claude",
      createdAt: "2026-03-27T22:00:00+08:00",
      title: "3月27日日报",
      content: "今日营收1370.14元...",
    };

    saveReport(report, TEST_REPORTS_DIR);
    const loaded = getReport("2026-03-27-claude", TEST_REPORTS_DIR);
    expect(loaded).not.toBeNull();
    expect(loaded!.title).toBe("3月27日日报");
    expect(loaded!.content).toBe("今日营收1370.14元...");
  });

  test("listReports returns all reports sorted by date desc", () => {
    saveReport({
      id: "2026-03-26-claude", date: "2026-03-26", source: "claude",
      createdAt: "2026-03-26T22:00:00+08:00", title: "3月26日", content: "test",
    }, TEST_REPORTS_DIR);
    saveReport({
      id: "2026-03-27-openclaw", date: "2026-03-27", source: "openclaw",
      createdAt: "2026-03-27T22:00:00+08:00", title: "3月27日", content: "test2",
    }, TEST_REPORTS_DIR);

    const list = listReports(TEST_REPORTS_DIR);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("2026-03-27-openclaw");
    expect(list[1].id).toBe("2026-03-26-claude");
  });
});
