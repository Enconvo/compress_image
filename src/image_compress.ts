import { statSync, existsSync } from "fs";
import path, { dirname } from "path";
import { Action, FinderUtil, RequestOptions, ChatMessageContent, ResponseAction, AssistantMessage, FileUtil, Runtime, EnconvoResponse } from '@enconvo/api'
import { promisify } from "util";
import { exec } from "child_process";
import { BinaryManager } from "./lib/binary_manager.ts";
import { escapePath } from "./utils.ts";

/** Image compression request parameters */
interface ImageCompressOptions extends RequestOptions {
  /** Compression quality 0-100 @default 80 */
  quality?: number;
  /** Output folder path, supports absolute, relative, or ~ paths @default "./enconvo-compressed-images" */
  destinationFolderPath?: string;
  /** Whether to overwrite the original image file @default true */
  overwrite?: boolean;
  /** Image file paths to compress @required */
  image_files?: string[];
}

/**
 * Compress images with adjustable quality using the Caesium engine
 * @param {Request} request - Request object, body is {@link ImageCompressOptions}
 * @returns Compressed image paths and compression summary
 */
export default async function main(req: Request): Promise<EnconvoResponse> {

  const options: ImageCompressOptions = await req.json();
  const { quality, overwrite, image_files, context_files } = options


  let filePaths: string[] = (image_files || context_files || []).map((filePath) => {
    return decodeURIComponent(filePath)
  })


  if (filePaths.length === 0) {
    filePaths = await FinderUtil.getSelectedItems()
  }

  let { images: imagesPaths } = FileUtil.categorizeFiles(filePaths)

  if (imagesPaths.length === 0) {
    throw new Error('No images to compress')
  }

  let images: ChatMessageContent[] = []
  imagesPaths.forEach((filePath) => {
    images.push(ChatMessageContent.imageUrl({ url: filePath }));
  })

  imagesPaths = imagesPaths.map((filePath) => {
    const newFilePath = filePath.replace('file://', '')
    return FileUtil.expandHome(newFilePath)
  })

  // Filter out non-existent files, keep their original paths for output
  const nonExistentPaths = imagesPaths.filter((filePath) => !existsSync(filePath))
  imagesPaths = imagesPaths.filter((filePath) => existsSync(filePath))

  if (imagesPaths.length === 0) {
    // All files don't exist, return original paths
    const originalPaths = nonExistentPaths
    if (!Runtime.isInteractiveMode()) {
      return EnconvoResponse.json({
        paths: originalPaths,
        summary: 'No valid image files found, returning original paths'
      })
    }
    const message = new AssistantMessage([{ type: "text", text: 'No valid image files found, returning original paths' }])
    return { type: "messages", messages: [message], actions: [] }
  }

  const caesium = await BinaryManager.ensureBinary('caesiumclt')


  let outputDir = dirname(imagesPaths[0]);
  if (!overwrite) {
    const destinationFolderPath = options.destinationFolderPath || './enconvo-compressed-images'
    if (destinationFolderPath.startsWith('~')) {
      outputDir = FileUtil.expandHome(destinationFolderPath)
    } else if (destinationFolderPath.startsWith('/')) {
      outputDir = destinationFolderPath
    } else if (imagesPaths.length === 1 && statSync(imagesPaths[0]).isDirectory()) {
      outputDir = path.join(outputDir, destinationFolderPath, path.basename(imagesPaths[0]));
    } else {
      outputDir = path.join(outputDir, destinationFolderPath);
    }

  } else {
    if (imagesPaths.length === 1) {
      if (statSync(imagesPaths[0]).isDirectory()) {
        outputDir = imagesPaths[0]
      }
    }
  }

  const commandOutputDir = outputDir.replace(/ /g, '\\ ')
  const commandFilePaths = imagesPaths.map((filePath) => {
    return escapePath(filePath)
  })


  const execSync = promisify(exec)
  const command = `${caesium} -q ${quality} -RS --overwrite all -o ${commandOutputDir} ${commandFilePaths.join(' ')}`
  const { stdout: result } = await execSync(command)


  const messageContent: ChatMessageContent[] = []

  let outputImagePaths: string[] = []
  if (overwrite) {
    outputImagePaths = imagesPaths
  } else {
    if (imagesPaths.length === 1 && statSync(imagesPaths[0]).isDirectory()) {
      outputImagePaths = [outputDir]
    } else {
      outputImagePaths = imagesPaths.map((filePath) => {
        const basename = path.basename(filePath)
        const finalePath = path.join(outputDir, basename)
        return finalePath
      })
    }
  }

  // Append non-existent file paths as-is
  outputImagePaths = [...outputImagePaths, ...nonExistentPaths]



  if (!Runtime.isInteractiveMode()) {

    return EnconvoResponse.json({
      paths: outputImagePaths,
      summary: `🎉${result}`
    })

  }



  outputImagePaths.forEach((image) => {
    messageContent.push(ChatMessageContent.imageUrl({ url: image }));
  });


  messageContent.push({
    type: "text",
    text: `🎉${result}`
  })

  const actions: ResponseAction[] = [
    Action.Paste({
      content: { files: outputImagePaths }
    }),
    Action.ShowInFinder({ path: outputImagePaths[0] }),
    Action.Copy({
      content: { files: outputImagePaths }
    })
  ]

  const message: AssistantMessage = new AssistantMessage(messageContent)

  return {
    type: "messages",
    messages: [message],
    actions: actions
  }
}

