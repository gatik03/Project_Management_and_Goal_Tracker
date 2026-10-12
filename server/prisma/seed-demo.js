import "dotenv/config";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Refuse before constructing a client or attempting a database connection.
if (process.env.NODE_ENV === "production") {
  console.error("Demo seed refused: NODE_ENV=production. Use a local demo database.");
  process.exit(1);
}

const prisma = new PrismaClient();
const year = new Date().getFullYear();
const activeQuarter = Math.floor(new Date().getMonth() / 3);
const quarters = ["Q1", "Q2", "Q3", "Q4"];

function fixtureId(key) {
  const hex = createHash("sha256").update(`goal-tracker-demo:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const teams = [
  {
    name: "Nisha Rao", email: "manager@atomberg.local", department: "Operations",
    title: "Head of manufacturing", employees: [
      ["Aarav Mehta", "employee@atomberg.local", "Manufacturing engineer"],
      ["Kavya Iyer", "kavya.iyer@atomberg.local", "Supplier quality engineer"],
      ["Rohan Kulkarni", "rohan.kulkarni@atomberg.local", "Production lead"],
      ["Sneha Patil", "sneha.patil@atomberg.local", "Process engineer"],
      ["Imran Shaikh", "imran.shaikh@atomberg.local", "Procurement executive"],
      ["Pooja Deshmukh", "pooja.deshmukh@atomberg.local", "Quality analyst"]
    ],
    goals: [
      ["Reduce supplier motor defects", "Track rejected motor assemblies per thousand received; review corrective actions with the Pune suppliers.", "Supplier quality", "NUMBER", "12"],
      ["Raise first-pass fan assembly yield", "Improve assembly checks and fixture calibration on the Chakan fan line.", "Manufacturing quality", "PERCENTAGE", "98"],
      ["Cut assembly changeover time", "Standardise tooling changes between 1200 mm and 1400 mm ceiling fan batches; measure minutes per changeover.", "Production efficiency", "NUMBER", "24"],
      ["Qualify a second bearing supplier", "Complete endurance testing and sign off the alternate bearing source for BLDC motors.", "Supply resilience", "BOOLEAN", "Yes"]
    ]
  },
  {
    name: "Aditya Menon", email: "aditya.menon@atomberg.local", department: "Product engineering",
    title: "Engineering manager", employees: [
      ["Ananya Nair", "ananya.nair@atomberg.local", "Motor design engineer"],
      ["Devansh Joshi", "devansh.joshi@atomberg.local", "Firmware engineer"],
      ["Meera Krishnan", "meera.krishnan@atomberg.local", "Reliability engineer"],
      ["Arjun Bhat", "arjun.bhat@atomberg.local", "Electronics engineer"],
      ["Tanvi Shah", "tanvi.shah@atomberg.local", "Test engineer"],
      ["Siddharth Reddy", "siddharth.reddy@atomberg.local", "Mechanical engineer"]
    ],
    goals: [
      ["Improve BLDC motor efficiency", "Validate winding and controller changes at rated load; efficiency target is 92 percent.", "Energy efficiency", "PERCENTAGE", "92"],
      ["Complete low-voltage endurance testing", "Run 180 fan samples through the 140 V endurance protocol and publish failure analysis.", "Product reliability", "NUMBER", "180"],
      ["Reduce controller bill of materials", "Qualify alternate controller components and document annualised savings in rupees.", "Value engineering", "CURRENCY", "4200000"],
      ["Release the quiet-mode firmware", "Ship the reviewed quiet-mode firmware with acoustic validation and a signed release checklist.", "Customer experience", "TEXT", "Validated release with noise below 35 dBA"]
    ]
  },
  {
    name: "Priya Kapoor", email: "priya.kapoor@atomberg.local", department: "Sales",
    title: "Channel sales manager", employees: [
      ["Rahul Verma", "rahul.verma@atomberg.local", "West region account executive"],
      ["Aditi Chavan", "aditi.chavan@atomberg.local", "Trade marketing executive"],
      ["Karthik Subramanian", "karthik.subramanian@atomberg.local", "South region account executive"],
      ["Neha Sethi", "neha.sethi@atomberg.local", "Channel analyst"],
      ["Manav Gupta", "manav.gupta@atomberg.local", "Distributor success executive"],
      ["Sana Khan", "sana.khan@atomberg.local", "Retail training executive"]
    ],
    goals: [
      ["Increase channel sell-through", "Improve monthly sell-through across the assigned distributor cluster using verified secondary-sales data.", "Channel growth", "PERCENTAGE", "85"],
      ["Deliver western-region fan revenue", "Convert the seasonal dealer pipeline into recognised revenue; track rupees excluding returns.", "Revenue", "CURRENCY", "42000000"],
      ["Activate demonstration counters", "Train store teams and activate working fan demonstrations at 60 priority retail counters.", "Retail execution", "NUMBER", "60"],
      ["Reduce aged distributor inventory", "Bring stock older than 90 days below 8 percent through dealer replenishment planning.", "Channel health", "PERCENTAGE", "8"]
    ]
  },
  {
    name: "Suresh Pillai", email: "suresh.pillai@atomberg.local", department: "Customer service",
    title: "Service operations manager", employees: [
      ["Ishita Bose", "ishita.bose@atomberg.local", "Service quality executive"],
      ["Vivek Salunkhe", "vivek.salunkhe@atomberg.local", "Field service coordinator"],
      ["Ritika Jain", "ritika.jain@atomberg.local", "Customer care lead"],
      ["Akash Das", "akash.das@atomberg.local", "Spares planning executive"],
      ["Shreya Rao", "shreya.rao@atomberg.local", "Service training executive"]
    ],
    goals: [
      ["Shorten service turnaround", "Close urban fan repair requests within 48 hours; measure the share of eligible requests meeting the window.", "Service responsiveness", "PERCENTAGE", "90"],
      ["Improve first-visit resolution", "Equip service partners with diagnostic guides and spares to resolve complaints on the first visit.", "Service quality", "PERCENTAGE", "88"],
      ["Train authorised service partners", "Certify 40 partner technicians on BLDC diagnostics and safe controller replacement.", "Partner readiness", "NUMBER", "40"],
      ["Publish the monsoon spares plan", "Agree the regional spares allocation and replenishment triggers with every service hub.", "Spares availability", "TEXT", "Approved allocation for all 12 service hubs"]
    ]
  }
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const totals = { users: 0, goals: 0, checkIns: 0, auditLogs: 0, cycles: 0 };

  await prisma.$transaction(async (db) => {
    async function userRecord(data) {
      const record = await db.user.upsert({
        where: { email: data.email },
        create: { id: fixtureId(data.email), ...data, passwordHash, isActive: true },
        update: { ...data, passwordHash, isActive: true }
      });
      totals.users += 1;
      return record;
    }

    async function audit(key, data) {
      const id = fixtureId(`audit:${key}`);
      // Audit rows are immutable in deployed databases. Re-seeding preserves
      // an existing fixture row instead of issuing an UPDATE against the trigger.
      await db.auditLog.createMany({ data: [{ id, ...data }], skipDuplicates: true });
      totals.auditLogs += 1;
    }

    const admin = await userRecord({
      name: "Vikram Shah", email: "admin@atomberg.local", role: "ADMIN",
      department: "People Team", title: "HR administrator", managerId: null
    });
    const actor = { actorId: admin.id, actorEmail: admin.email };
    const planStates = ["DRAFT", "SUBMITTED", "REWORK_REQUIRED", "APPROVED", "LOCKED"];
    let employeeIndex = 0;

    for (const team of teams) {
      const manager = await userRecord({
        name: team.name, email: team.email, role: "MANAGER", department: team.department,
        title: team.title, managerId: null
      });

      for (const [name, email, title] of team.employees) {
        const employee = await userRecord({
          name, email, title, role: "EMPLOYEE", department: team.department, managerId: manager.id
        });
        // The primary demo opens on an editable 85% plan. Other accounts cover
        // approved/locked check-ins and each review state without impossible plans.
        const planStatus = employeeIndex === 0 ? "REWORK_REQUIRED" : planStates[employeeIndex % planStates.length];
        const weights = employeeIndex === 0 ? [30, 25, 20, 10] : [35, 25, 25, 15];

        for (const [goalIndex, template] of team.goals.entries()) {
          const [goalTitle, description, thrustArea, uomType, target] = template;
          const id = fixtureId(`goal:${email}:${goalIndex}`);
          const status = employeeIndex === 0 && goalIndex > 1 ? "DRAFT" : planStatus;
          const reviewed = ["REWORK_REQUIRED", "APPROVED", "LOCKED"].includes(status);
          const locked = ["APPROVED", "LOCKED"].includes(status);
          const reviewedAt = new Date(Date.UTC(year, 0, 15));
          const data = {
            title: goalTitle, description, thrustArea, uomType, target,
            weightage: weights[goalIndex], deadline: new Date(Date.UTC(year, 11, 31)),
            status, employeeId: employee.id,
            managerNote: status === "REWORK_REQUIRED"
              ? "Specify the baseline and the measurement source before resubmitting. Reserve weight for supplier readiness." : null,
            reviewedById: reviewed ? manager.id : null,
            reviewedAt: reviewed ? reviewedAt : null, lockedAt: locked ? reviewedAt : null
          };
          await db.goal.upsert({ where: { id }, create: { id, ...data }, update: data });
          totals.goals += 1;

          if (locked) {
            for (const [quarterIndex, quarter] of quarters.slice(0, 3).entries()) {
              const plannedTarget = ["NUMBER", "PERCENTAGE", "CURRENCY"].includes(uomType)
                ? Number(target) : uomType === "BOOLEAN" ? 1 : 100;
              const ratio = [0.62, 0.84, 1, 1.08, 1.22][(employeeIndex + goalIndex + quarterIndex) % 5];
              const actualAchievement = Number((plannedTarget * ratio).toFixed(2));
              const checkIn = {
                plannedTarget, actualAchievement,
                status: ratio >= 1 ? "COMPLETED" : quarterIndex === 2 && ratio < 0.7 ? "NOT_STARTED" : "ON_TRACK",
                employeeNote: ratio >= 1
                  ? "Quarter target met. The measurement sheet and partner sign-off are ready for review."
                  : "Progress is behind the quarter target. Weekly partner reviews and a revised delivery schedule are in place.",
                managerComment: quarterIndex < 2
                  ? "Measurement source checked. Carry the corrective actions into the next quarter review." : null,
                reviewedAt: quarterIndex < 2 ? new Date(Date.UTC(year, quarterIndex * 3 + 2, 28)) : null
              };
              await db.quarterlyCheckIn.upsert({
                where: { goalId_quarter: { goalId: id, quarter } },
                create: { id: fixtureId(`checkin:${id}:${quarter}`), goalId: id, quarter, ...checkIn },
                update: checkIn
              });
              totals.checkIns += 1;
            }
          }

          if (status === "REWORK_REQUIRED" && goalIndex === 0) {
            await audit(`unlock:${id}`, {
              ...actor, action: "GOAL_UNLOCKED", entityType: "Goal", entityId: id,
              oldValue: { status: "APPROVED", lockedAt: reviewedAt.toISOString() },
              newValue: { status: "REWORK_REQUIRED", lockedAt: null, reason: "Supplier specification changed after sign-off; revise the baseline and target." },
              createdAt: new Date(Date.UTC(year, 8, 15))
            });
          }
        }

        await audit(`user:${email}`, {
          ...actor, action: "USER_UPDATED", entityType: "User", entityId: employee.id,
          oldValue: { managerId: null, title: "Executive" },
          newValue: { managerId: manager.id, title: employee.title },
          createdAt: new Date(Date.UTC(year, 0, 8 + employeeIndex))
        });
        employeeIndex += 1;
      }
    }

    // Reset only this year's demo cycle; leave other years' configurations alone.
    await db.quarterlyCycleConfig.updateMany({ where: { year, isActive: true }, data: { isActive: false } });
    for (const [index, quarter] of quarters.entries()) {
      const data = {
        startDate: new Date(Date.UTC(year, index * 3, 1)),
        endDate: new Date(Date.UTC(year, index * 3 + 3, 0, 23, 59, 59, 999)),
        isActive: index === activeQuarter
      };
      const cycle = await db.quarterlyCycleConfig.upsert({
        where: { year_quarter: { year, quarter } },
        create: { id: fixtureId(`cycle:${year}:${quarter}`), year, quarter, ...data }, update: data
      });
      await audit(`cycle:${year}:${quarter}`, {
        ...actor, action: "CYCLE_CONFIG_UPDATED", entityType: "QuarterlyCycleConfig", entityId: cycle.id,
        oldValue: { isActive: false }, newValue: { year, quarter, ...data },
        createdAt: new Date(Date.UTC(year, 0, 2))
      });
      totals.cycles += 1;
    }
  }, { timeout: 60000 });

  console.log(`Demo fixtures ready for ${year} (${quarters[activeQuarter]} active): ${JSON.stringify(totals)}`);
  console.log("Existing employee, manager and admin demo logins remain available; password: Password123!");
}

try {
  await main();
} catch (error) {
  console.error("Demo seed failed. Check DATABASE_URL and apply the existing migrations.", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
