import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { toCsv, toExcelHtml } from "./export.service.js";
import { getReportExportRows, getReportingDashboard } from "./report.service.js";

const router = Router();

const filterSchema = z.object({
  department: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "REWORK_REQUIRED", "APPROVED", "LOCKED"]).optional(),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional()
});

function parseFilters(request) {
  return filterSchema.parse({
    department: request.query.department || undefined,
    status: request.query.status || undefined,
    quarter: request.query.quarter || undefined
  });
}

router.use(requireAuth, requireRole("MANAGER", "ADMIN"));

router.get("/dashboard", async (request, response, next) => {
  try {
    const filters = parseFilters(request);
    const dashboard = await getReportingDashboard(request.user, filters);
    return response.json({ dashboard });
  } catch (error) {
    return next(error);
  }
});

router.get("/export.csv", async (request, response, next) => {
  try {
    const filters = parseFilters(request);
    const rows = await getReportExportRows(request.user, filters);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=achievement-report.csv");
    return response.send(toCsv(rows));
  } catch (error) {
    return next(error);
  }
});

router.get("/export.xls", async (request, response, next) => {
  try {
    const filters = parseFilters(request);
    const rows = await getReportExportRows(request.user, filters);
    response.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=achievement-report.xls");
    return response.send(toExcelHtml(rows));
  } catch (error) {
    return next(error);
  }
});

export { router as reportRouter };
