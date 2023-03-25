import { Configuration, OpenAIApi } from "openai"
import fs from 'fs'

export default class RefactorService {
  static async call(prompt, filePath, shouldLog = false) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.5,
      max_tokens: (4096 - (prompt.split(" ").length * 2)),
    })

    if (shouldLog) {
      this.log(`Response received: \n`)
      this.log(response)
      this.log(`Choices:`)
      this.log(response?.data?.choices)
    }
    if (!response?.data?.choices) return null
    let result = response.data.choices
      .map((d) => d?.text?.trim())
      .join()
    if (shouldLog) {
      this.log(`joined choices: ${result}`)
    }
    this.write(this.extractSourceCode(result), filePath)
    return result
  }

  static extractSourceCode(input) {
    const lines = input.split("\n")
    if (lines.length > 0 && lines[0].startsWith("Updated source code:")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[0].startsWith("// Your code")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[0].startsWith("-------")) {
      lines.shift()
    }
    return lines.join("\n")
  }

  static async write(data, filePath) {
    await fs.promises.writeFile(filePath, data)
  }

  static async load(filePath) {
    const fileDoesNotExist = !await this.fileExists(filePath)
    if (fileDoesNotExist) return("")
    try {
      // Use the fs module to read the file
      const data = await fs.promises.readFile(filePath, "utf-8")
      return data
    } catch (err) {
      this.log(err)
      return("")
    }
  }

  static async fileExists(filePath) {
    return fs.existsSync(filePath)
  }

  static async getPreamble(preamblePath) {
    try {
      // Use the fs module to read the file
      const preamble = await fs.promises.readFile(preamblePath, "utf-8")
      return preamble
    } catch (err) {
      this.log(err)
    }
  }

  static log(message) {
    console.log(message)
  }
}