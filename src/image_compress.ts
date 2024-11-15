import { statSync } from "fs";
import path, { dirname } from "path";
import { uuid, ActionProps, Action, Attachment, MessageContent, CoreDataChatHistory, ChatMessage, FinderUtil, environment } from '@enconvo/api'
import { promisify } from "util";
import { exec } from "child_process";
import { isARM } from "./lib/utils.ts";
import * as shellQuote from 'shell-quote';
import { escapePath } from "./utils.ts";

const chatHistory = new CoreDataChatHistory()


export default async function main(req: Request) {

  const { options } = await req.json();
  const { quality, destinationFolderPath, overwrite } = options

  let filePaths: string[] = (options.context_files || [])
  if (filePaths.length === 0) {
    filePaths = await FinderUtil.getSelectedItems()
  }


  console.log('filePaths', filePaths)
  if (filePaths.length === 0) {
    throw new Error('No files selected')
  }

  let images: MessageContent[] = []
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


  const requestId = uuid()

  const storeMessage: ChatMessage = {
    id: requestId,
    role: "human",
    content: images
  }

  // res.context(storeMessage)

  await chatHistory.addMultiModalMessage({
    message: storeMessage,
    customId: requestId
  })

  const caesium = path.join(environment.assetsPath, isARM ? 'caesiumcltarm' : 'caesiumclt86')

  let outputDir = dirname(filePaths[0]);
  console.log('overwrite', overwrite, filePaths.length, statSync(filePaths[0]).isDirectory())
  if (!overwrite) {
    if (filePaths.length === 1 && statSync(filePaths[0]).isDirectory()) {
      // 是否是dir
      outputDir = path.join(outputDir, destinationFolderPath, path.basename(filePaths[0]));
    } else {
      outputDir = path.join(outputDir, destinationFolderPath);
    }

  } else {
    if (filePaths.length === 1) {
      // 是否是dir
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

  const message: ChatMessage = {
    role: "ai",
    content: []
  }

  const { runType } = options
  if (runType !== 'flow') {
    // @ts-ignore 
    message.content.push({
      type: "text",
      text: `🎉Compression successful 🎉  \n${result}`
    })
  }


  let imagePaths: string[] = []
  if (overwrite) {
    imagePaths = filePaths
  } else {

    if (filePaths.length === 1 && statSync(filePaths[0]).isDirectory()) {
      // 是否是dir
      imagePaths = [outputDir]
    } else {
      // 把原来的文件路径替换成压缩后的文件路径
      imagePaths = filePaths.map((filePath) => {
        const basename = path.basename(filePath)
        const finalePath = path.join(outputDir, basename)
        console.log('basename', basename, finalePath)
        return finalePath
      })
    }
  }


  imagePaths.forEach((image) => {
    // @ts-ignore 
    message.content.push({
      type: "file",
      file_url: {
        url: `file://${image}`
      },
    });
  });

  await chatHistory.addLCMultiModalMessage({
    message: message,
    replyToId: requestId
  })

  const actions: ActionProps[] = [
    Action.Paste({
      content: { files: imagePaths }
    }),
    Action.ShowInFinder({ path: imagePaths[0] }),
    Action.Copy({
      content: { files: imagePaths }
    })
  ]

  await Attachment.showAttachments([])

  return {
    type: "messages",
    messages: [message],
    actions: actions
  }
}

