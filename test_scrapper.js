import { getLatestPosts } from './scrapper.js'
;(async () => {
  console.log(await getLatestPosts())
})()
