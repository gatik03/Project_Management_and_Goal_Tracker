import ExcelJS from "exceljs";

const headers = ["Employee", "Department", "Goal", "Quarter", "Planned Target", "Actual Achievement", "Achievement %", "Status"];

function safeCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function rowValues(row) {
  return [
    row.employee, row.department, row.goalTitle, row.quarter,
    row.plannedTarget, row.actualAchievement, row.achievementPercent, row.status
  ];
}

function escapeCsvValue(value) {
  return `"${safeCell(value).replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => rowValues(row).map(escapeCsvValue).join(","))
  ].join("\n");
}

export async function toXlsx(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Achievement report");
  sheet.addRow(headers);
  for (const row of rows) {
    // Force text cells: never turn persisted goal/user content into a formula.
    sheet.addRow(rowValues(row).map(safeCell));
  }
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => { column.width = 24; });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
