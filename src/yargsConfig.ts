import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pkg from "../package.json" assert { type: "json" };

const validExtensions = ["mp3", "wav", "flac", "ogg"];

export const yargsConfig = yargs(hideBin(process.argv))
  .scriptName(pkg.name)
  .version(pkg.version)
  .usage(pkg.description)
  .option("url", {
    type: "string",
    describe: "YouTube Video URL",
    alias: "u",
    demandOption: true,
  })
  .option("segment-length", {
    type: "number",
    describe: "Length of each segment in seconds",
    alias: "l",
    default: 30,
  })
  .option("dataset-name", {
    type: "string",
    describe: "Name of the dataset",
    alias: "n",
    default: "dataset",
  })
  .option("output", {
    type: "string",
    describe: "Output directory",
    alias: "o",
    default: "./",
  })
  .option("extension", {
    type: "string",
    describe: "Output file extension",
    alias: "e",
    default: "mp3",
  })
  .option("remove-silence", {
    type: "boolean",
    describe: "Remove silence from audio",
    alias: "s",
    default: false,
  })
  .option("threshold", {
    type: "number",
    describe: "Start threshold in dB (below which audio is considered silent)",
    alias: "t",
    default: -40,
  })
  .option("keep-original", {
    type: "boolean",
    describe: "Keep original video file",
    alias: "k",
    default: false,
  })
  .check((argv) => {
    if (argv["segment-length"] < 1) {
      throw new Error("Segment length must be greater than 0");
    }
    if (argv.threshold > 0) {
      throw new Error("Threshold must be a negative value");
    }
    if (!validExtensions.includes(argv.extension)) {
      throw new Error(
        `Invalid extension: ${
          argv.extension
        }. Supported extensions are: ${validExtensions.join(", ")}`
      );
    }
    return true;
  })
  .help()
  .alias("help", "h")
  .alias("version", "v")
  .strict();

export type ArgvType = Awaited<ReturnType<(typeof yargsConfig)["parse"]>>;
