import { buildProgram } from "./cli/program.js";

const program = buildProgram();
program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
