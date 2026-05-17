function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function toCsv(rows) {
  const headers = ["Employee", "Department", "Goal", "Quarter", "Planned Target", "Actual Achievement", "Achievement %", "Status"];
  const body = rows.map((row) => [
    row.employee,
    row.department,
    row.goalTitle,
    row.quarter,
    row.plannedTarget,
    row.actualAchievement,
    row.achievementPercent,
    row.status
  ].map(escapeCsvValue).join(","));

  return [headers.map(escapeCsvValue).join(","), ...body].join("\n");
}

export function toExcelHtml(rows) {
  const headers = ["Employee", "Department", "Goal", "Quarter", "Planned Target", "Actual Achievement", "Achievement %", "Status"];
  const body = rows.map((row) => `
    <tr>
      <td>${row.employee}</td>
      <td>${row.department}</td>
      <td>${row.goalTitle}</td>
      <td>${row.quarter}</td>
      <td>${row.plannedTarget}</td>
      <td>${row.actualAchievement}</td>
      <td>${row.achievementPercent}</td>
      <td>${row.status}</td>
    </tr>
  `).join("");

  return `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table>
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `;
}
