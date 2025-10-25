import path from "path";
import fs from "fs";

import { Downloader } from "./Downloader";
import { Segmenter } from "./Segmenter";

import type { ArgvType } from "./yargsConfig";

import { progress } from "./utils";

export class Audset {
  args: ArgvType;
  outputDirectory: string;

  constructor(args: ArgvType) {
    this.args = args;

    const { output, datasetName } = args;
    const outputDirectory = path.resolve(output, datasetName);
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }
    this.outputDirectory = outputDirectory;
  }

  async run() {
    const downloader = new Downloader(this.args, this.outputDirectory);
    const segmenter = new Segmenter(this.args, this.outputDirectory);

    // Get the video stream
    const videoStream = await downloader.getVideoStream();

    // Download progress
    videoStream.on("response", progress);

    // Save the file
    const filePath = await downloader.saveFile(videoStream);

    // Segment the file
    await segmenter.segmentFile(filePath);
  }
}
