import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

// Serializable retries cover concurrent plan edits and the count/sum checks
// that would otherwise both observe the same old set of goals.
export async function withSerializableTransaction(operation) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000
      });
    } catch (error) {
      if (error.code !== "P2034" || attempt === 3) throw error;
    }
  }
}
