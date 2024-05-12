import { statSync } from "fs";
import path, { dirname } from "path";
import { uuid, ActionProps, Action, Attachment, MessageContent, CoreDataChatHistory, ChatMessage, FinderUtil, environment } from '@enconvo/api'
import { promisify } from "util";
import { exec } from "child_process";
import { isARM } from "./lib/utils.ts";

const chatHistory = new CoreDataChatHistory()


export default async function main(req: Request) {

  const { options } = await req.json();
  const { quality, destinationFolderPath, overwrite } = options

  let filePaths: string[] = (options.contextFiles || [])

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
        url: `file://${filePath}`
      },
    });

  })

  const requestId = uuid()

  await Attachment.clearAttachments()

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
  if (!overwrite) {
    outputDir = path.join(outputDir, destinationFolderPath);
  } else {
    if (filePaths.length === 1) {
      // 是否是dir
      if (statSync(filePaths[0]).isDirectory()) {
        outputDir = filePaths[0]
      }
    }
  }
  const execSync = promisify(exec)
  const command = `${caesium} -q ${quality} -RSO -o ${outputDir} ${filePaths.join(' ')}`
  const { stdout: result, stderr } = await execSync(command)
  console.log('result', result)

  const message: ChatMessage = {
    role: "ai",
    content: [
      {
        type: "text",
        text: `🎉Compression successful 🎉  \n${result}`
      }
    ]
  }
  let imagePaths: string[] = []

  filePaths.forEach((image) => {
    imagePaths.push(image)
    message.content.push({
      type: "file",
      image_url: {
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

