# YouTube MP3 Dataset Collector

This script provides a streamlined way to create MP3 file datasets from YouTube videos. It automates the process of downloading a YouTube video, converting it into MP3 format, and segmenting the audio into smaller files of a user-specified duration. This tool is particularly useful for researchers, developers, and data scientists working on machine learning, audio analysis, or similar projects.

## Features

* YouTube Video Download: Downloads high-quality audio from YouTube videos.

* MP3 Conversion: Converts audio streams to MP3 format using ffmpeg.

* Audio Segmentation: Splits the MP3 file into smaller segments of a specified length (in seconds).

* Silent Audio Removal: Automatically removes silent audio segments based on a specified threshold during the segmentation process.

* Progress Tracking: Displays real-time progress for downloading and segmenting audio files.

* Automatic Cleanup: Deletes temporary files and directories after the process is completed.

## Release

For ease of use, an executable version of the script is available. You can download the .exe file from the [Releases](../../releases) section of this repository. This eliminates the need to set up Node.js or manually install dependencies.

## Prerequisites

To run this script, ensure you have the following installed:

* Node.js (v14 or later recommended)

## Installation

* Clone this repository:

    ```
    git clone <repository-url>  
    cd repo-name
    ```

* Install the required dependencies:

    `npm install`

## Usage

* Run the script:

    `npm start`

* Follow the prompts:

    ```
    Enter the YouTube URL:

    Enter the name of the dataset (default: example_dataset): 

    Enter the length of each segment in seconds (default: 10):

    Enter the start threshhold in DB (below which audio is considered silent) (higher DB for louder background noise, lower DB for quite background noise) (default: -50):
    ```

* The script will:

    * Download the audio from the specified YouTube video.

    * Convert it to MP3 format.

    * Split the MP3 file into smaller segments.

    * Remove silent audio segments based on a specified threshold during the segmentation process.

    The segmented audio files will be saved in the `datasets/<dataset-name>` directory.

* Example Output Structure
```
|-- datasets
|   |-- example_dataset
|       |-- example_dataset_001.mp3
|       |-- example_dataset_002.mp3
|       |-- ...
```

## Notes

* The script automatically validates YouTube URLs.

* If the last segment of the audio is shorter than the specified segment length, it will be deleted.

* Temporary files are cleaned up after the process is completed.

## Dependencies

This script uses the following npm packages:

* [@distube/ytdl-core](https://github.com/distubejs/ytdl-core): For downloading YouTube videos.

* [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg): For MP3 conversion and audio processing.

* [chokidar](https://github.com/paulmillr/chokidar): For monitoring file system changes.

* [readline](https://github.com/tonerdo/readline): For interactive user input.

* [fs](https://github.com/npm/fs): For file system operations.

* [path](https://github.com/jinder/path): For path manipulation.

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue to suggest improvements or report bugs.

