-- CreateTable
CREATE TABLE "Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Operator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "productionLineId" INTEGER NOT NULL,
    "groupId" INTEGER,
    "job" TEXT NOT NULL DEFAULT 'operator',
    "qrCode" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "totalMerit" INTEGER NOT NULL DEFAULT 0,
    "totalMisconduct" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Operator_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Operator_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Operator_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "ProductionLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Operator_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Operator" ("createdAt", "departmentId", "employeeId", "id", "performanceScore", "position", "productionLineId", "qrCode", "shiftId", "totalMerit", "totalMisconduct", "updatedAt", "userId") SELECT "createdAt", "departmentId", "employeeId", "id", "performanceScore", "position", "productionLineId", "qrCode", "shiftId", "totalMerit", "totalMisconduct", "updatedAt", "userId" FROM "Operator";
DROP TABLE "Operator";
ALTER TABLE "new_Operator" RENAME TO "Operator";
CREATE UNIQUE INDEX "Operator_employeeId_key" ON "Operator"("employeeId");
CREATE UNIQUE INDEX "Operator_userId_key" ON "Operator"("userId");
CREATE UNIQUE INDEX "Operator_qrCode_key" ON "Operator"("qrCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");
