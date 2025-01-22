import { statSync } from "fs";
import path, { dirname } from "path";
import { Action, FinderUtil, environment, RequestOptions, Response, ChatMessageContent, ResponseAction, AssistantMessage, FileUtil } from '@enconvo/api'
import { promisify } from "util";
import { exec } from "child_process";
import { isARM } from "./lib/utils.ts";
import { escapePath } from "./utils.ts";

interface ImageCompressOptions extends RequestOptions {
  quality?: number;
  destinationFolderPath?: string;
  overwrite?: boolean;
  image_files?: string[];
}

export default async function main(req: Request): Promise<Response> {

  const options: ImageCompressOptions = await req.json();
  const { quality, overwrite, image_files, context_files } = options


  let filePaths: string[] = (image_files || context_files || [])
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

  imagesPaths = imagesPaths.map((filePath) => filePath.replace('file://', ''))


  const caesium = path.join(environment.assetsPath, isARM ? 'caesiumcltarm' : 'caesiumclt86')


  let outputDir = dirname(imagesPaths[0]);
  if (!overwrite) {
    const destinationFolderPath = options.destinationFolderPath || './enconvo-compressed-images'
    if (imagesPaths.length === 1 && statSync(imagesPaths[0]).isDirectory()) {
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
  const command = `${caesium} -q ${quality} -RSO -o ${commandOutputDir} ${commandFilePaths.join(' ')}`
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


  outputImagePaths.forEach((image) => {
    messageContent.push(ChatMessageContent.imageUrl({ url: `file://${image}` }));
  });


  messageContent.push({
    type: "text",
    text: `🎉Compression successful 🎉  \n${result}`
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

