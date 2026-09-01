-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "field" TEXT NOT NULL DEFAULT 'umum',
    "description" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "image_url" TEXT,
    "links" TEXT,
    "organizerType" TEXT NOT NULL DEFAULT 'private',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_opportunities" ("category", "created_at", "deadline", "description", "eligibility", "field", "id", "image_url", "links", "location", "organizer", "source_url", "title", "type") SELECT "category", "created_at", "deadline", "description", "eligibility", "field", "id", "image_url", "links", "location", "organizer", "source_url", "title", "type" FROM "opportunities";
DROP TABLE "opportunities";
ALTER TABLE "new_opportunities" RENAME TO "opportunities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
