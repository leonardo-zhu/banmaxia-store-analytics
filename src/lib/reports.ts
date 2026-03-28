import fs from "fs";
import path from "path";
import type { StoredReport } from "@/services/youzan/types";

const DEFAULT_REPORTS_DIR = path.join(process.cwd(), "reports");

function reportFilePath(report: StoredReport, reportsDir: string): string {
  const year = report.date.substring(0, 4);
  const month = report.date.substring(5, 7);
  return path.join(reportsDir, year, month, `${report.id}.md`);
}

function reportToMarkdown(report: StoredReport): string {
  return [
    "---",
    `id: ${report.id}`,
    `date: ${report.date}`,
    `source: ${report.source}`,
    `createdAt: ${report.createdAt}`,
    `title: ${report.title}`,
    "---",
    "",
    report.content,
  ].join("\n");
}

function parseReportMarkdown(raw: string, id: string): StoredReport | null {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!fmMatch) return null;

  const meta: Record<string, string> = {};
  for (const line of fmMatch[1].split("\n")) {
    const idx = line.indexOf(": ");
    if (idx > 0) {
      meta[line.substring(0, idx).trim()] = line.substring(idx + 2).trim();
    }
  }

  return {
    id: meta.id || id,
    date: meta.date || "",
    source: (meta.source as StoredReport["source"]) || "manual",
    createdAt: meta.createdAt || "",
    title: meta.title || "",
    content: fmMatch[2],
  };
}

export function saveReport(
  report: StoredReport,
  reportsDir: string = DEFAULT_REPORTS_DIR
): void {
  const filePath = reportFilePath(report, reportsDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, reportToMarkdown(report), "utf-8");
}

export function getReport(
  id: string,
  reportsDir: string = DEFAULT_REPORTS_DIR
): StoredReport | null {
  const dateMatch = id.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return null;

  const filePath = path.join(reportsDir, dateMatch[1], dateMatch[2], `${id}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return parseReportMarkdown(raw, id);
}

export function listReports(
  reportsDir: string = DEFAULT_REPORTS_DIR
): StoredReport[] {
  const reports: StoredReport[] = [];

  if (!fs.existsSync(reportsDir)) return reports;

  const years = fs.readdirSync(reportsDir).filter((d) => /^\d{4}$/.test(d));
  for (const year of years) {
    const yearPath = path.join(reportsDir, year);
    const months = fs.readdirSync(yearPath).filter((d) => /^\d{2}$/.test(d));
    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      const files = fs.readdirSync(monthPath).filter((f) => f.endsWith(".md"));
      for (const file of files) {
        const raw = fs.readFileSync(path.join(monthPath, file), "utf-8");
        const fileId = file.replace(".md", "");
        const report = parseReportMarkdown(raw, fileId);
        if (report) reports.push(report);
      }
    }
  }

  return reports.sort((a, b) => b.date.localeCompare(a.date));
}
