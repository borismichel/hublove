import { Command } from "commander";
import { wizardCommand } from "../commands/wizard.js";
import { initCommand } from "../commands/init.js";
import { convertCommand } from "../commands/convert.js";
import { uploadCommand } from "../commands/upload.js";
import { doctorCommand } from "../commands/doctor.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("hublove")
    .description(
      "Convert Lovable/React landing pages to HubSpot CMS — AI-powered CLI tool"
    )
    .version("0.1.4")
    .action(wizardCommand);

  program
    .command("init")
    .description("Check and install required tools")
    .action(initCommand);

  program
    .command("convert")
    .description("Convert a React project to HubSpot modules")
    .action(convertCommand);

  program
    .command("upload")
    .description("Upload theme to HubSpot")
    .action(uploadCommand);

  program
    .command("doctor")
    .description("Diagnose environment issues")
    .action(doctorCommand);

  return program;
}
