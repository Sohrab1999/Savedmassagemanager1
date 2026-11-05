import { resetSeed } from "../src/server/seed";

resetSeed()
  .then((counts) => {
    console.log("Seeded:", counts);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
