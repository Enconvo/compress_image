import { statSync } from "fs";
import path, { dirname } from "path";
import { Action, FinderUtil, environment, RequestOptions, EnconvoResponse, ChatMessageContent, ResponseAction, AssistantMessage } from '@enconvo/api'
import { promisify } from "util";
import { exec } from "child_process";
import { isARM } from "./lib/utils.ts";
import { escapePath } from "./utils.ts";


export default async function main(req: Request): Promise<EnconvoResponse> {

  const options: RequestOptions = await req.json();
  const { quality, destinationFolderPath, overwrite } = options

  let filePaths: string[] = (options.context_files || [])
  if (filePaths.length === 0) {
    filePaths = await FinderUtil.getSelectedItems()
  }

  console.log('filePaths', filePaths)
  if (filePaths.length === 0) {
    throw new Error('No files selected')
  }

  let images: ChatMessageContent[] = []
  filePaths.forEach((filePath) => {
    images.push({
      type: "image_url",
      image_url: {
        url: filePath
      },
    });
  })


  console.log('filePaths', filePaths)
  // rm file://
  filePaths = filePaths.map((filePath) => filePath.replace('file://', ''))



  const caesium = path.join(environment.assetsPath, isARM ? 'caesiumcltarm' : 'caesiumclt86')

  let outputDir = dirname(filePaths[0]);
  console.log('overwrite', overwrite, filePaths.length, statSync(filePaths[0]).isDirectory())
  if (!overwrite) {
    if (filePaths.length === 1 && statSync(filePaths[0]).isDirectory()) {
      outputDir = path.join(outputDir, destinationFolderPath, path.basename(filePaths[0]));
    } else {
      outputDir = path.join(outputDir, destinationFolderPath);
    }

  } else {
    if (filePaths.length === 1) {
      if (statSync(filePaths[0]).isDirectory()) {
        outputDir = filePaths[0]
      }
    }
  }

  const commandOutputDir = outputDir.replace(/ /g, '\\ ')
  const commandFilePaths = filePaths.map((filePath) => {
    return escapePath(filePath)
  })


  console.log('outputDir', outputDir)
  const execSync = promisify(exec)
  const command = `${caesium} -q ${quality} -RSO -o ${commandOutputDir} ${commandFilePaths.join(' ')}`
  console.log('comman:', command)
  const { stdout: result, stderr } = await execSync(command)
  console.log('result', result)


  const messageContent: ChatMessageContent[] = []


  let imagePaths: string[] = []
  if (overwrite) {
    imagePaths = filePaths
  } else {

    if (filePaths.length === 1 && statSync(filePaths[0]).isDirectory()) {
      imagePaths = [outputDir]
    } else {
      imagePaths = filePaths.map((filePath) => {
        const basename = path.basename(filePath)
        const finalePath = path.join(outputDir, basename)
        console.log('basename', basename, finalePath)
        return finalePath
      })
    }
  }


  imagePaths.forEach((image) => {
    messageContent.push({
      type: "file",
      file_url: {
        url: `file://${image}`
      },
    });
  });


  messageContent.push({
    type: "text",
    text: `🎉Compression successful 🎉  \n${result}`
  })

  const actions: ResponseAction[] = [
    Action.Paste({
      content: { files: imagePaths }
    }),
    Action.ShowInFinder({ path: imagePaths[0] }),
    Action.Copy({
      content: { files: imagePaths }
    })
  ]

  const message: AssistantMessage = new AssistantMessage(messageContent)

  return {
    type: "messages",
    messages: [message],
    actions: actions
  }
}

