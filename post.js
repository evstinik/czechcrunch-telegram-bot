import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getLatestPosts } from './scrapper.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, 'appstate.json')

const token = process.env.TELEGRAM_API_TOKEN
const bot = new TelegramBot(token, { polling: false })

;(async () => {
  console.info(`Running at ${new Date()}`)

  let appState = {
    lastRun: new Date(0).toISOString(),
    lastPublishedArticleHref: null,
  }
  try {
    const appStateContenst = await fs.readFile(configPath, { encoding: 'utf-8' })
    const readAppState = JSON.parse(appStateContenst)
    appState = readAppState
    console.info('Loaded app state', readAppState)
  } catch (err) {
    console.warn('App state cannot be loaded, will use default one', err)
  }

  try {
    const posts = await getLatestPosts()
    console.info(`Loaded ${posts.length} posts`)

    let sendPostsStartingFromIndex = 0
    if (appState.lastPublishedArticleHref) {
      sendPostsStartingFromIndex =
        1 + posts.findIndex((post) => post.href == appState.lastPublishedArticleHref)
    }

    const newPosts = posts.filter((_, idx) => idx >= sendPostsStartingFromIndex)
    console.info(`${newPosts.length} new posts`)

    newPosts.forEach((post) => {
      function truncate(s, maxLength) {
        s = s.split('\n')[0]
        if (s.length > maxLength) {
          return `${s.substr(0, maxLength - 3)}...`
        }
        return s
      }

      const tags =
        post.labels.length > 0
          ? '\n\n' + post.labels.map((l) => '#' + l.toLocaleLowerCase().replace(/ /, '-')).join(' ')
          : ''
      const noBodyContent = `*${post.title}*${tags}\n\n\n\n${post.href}`
      const maxLength = 1024 - noBodyContent.length
      const firstParagraph = post.meta.split('\n\n')[0]
      const truncatedBody = truncate(firstParagraph, maxLength)

      const finalTextContent = `*${post.title}*${tags}\n\n${truncatedBody}\n\n${post.href}`

      if (post.imgHref) {
        bot.sendPhoto('@czechcruncher', post.imgHref, {
          caption: finalTextContent,
          parse_mode: 'Markdown',
          disable_notification: true,
        })
      } else {
        bot.sendMessage('@czechcruncher', finalTextContent, {
          parse_mode: 'Markdown',
          disable_notification: true,
        })
      }

      appState.lastPublishedArticleHref = post.href
    })

    appState.lastRun = new Date().toISOString()
  } catch (err) {
    console.warn('Posting failed', err)
  }

  try {
    await fs.writeFile(configPath, JSON.stringify(appState, undefined, 2))
  } catch (err) {
    console.warn('Failed to save configuration', err)
  }
})()
