import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

function getBestResolutionImg(srcSet) {
  const options = srcSet.split(',').map((s) => s.trim())
  const lastOption = options[options.length - 1]
  const href = lastOption.split(' ')[0]
  return href
}

export async function getLatestPosts() {
  const response = await fetch('https://cc.cz')
  const html = await response.text()
  const $ = cheerio.load(html)

  let top = $('.b-article-top')
    .map((_, el) => {
      const imgEl = $(el).find('.b-article-top__image img').first()
      const imgSrcSet = $(imgEl).attr('srcset') || $(imgEl).attr('data-srcset')
      const imgHref = imgSrcSet
        ? getBestResolutionImg(imgSrcSet)
        : $(imgEl).attr('src') || $(imgEl).attr('data-src')
      const titleEl = $(el).find('.b-article-top__title a').first()
      const title = $(titleEl).text()
      const href = $(titleEl).attr('href')
      const publishedEl = $(el).find('time')
      const publishedAt = $(publishedEl).attr('datetime')
      const labels = Array.from(
        new Set(
          $(el)
            .find('.labels a')
            .map((_, _el) => {
              return $(_el).text()
            })
            .get()
        )
      ).sort()

      return { imgHref, title, href, publishedAt, labels }
    })
    .get()

  let list = $('.c-articles__item')
    .map((_, el) => {
      const find = (...selectors) => {
        let _el
        for (const selector of selectors) {
          _el = $(el).find(selector).first()
          if (_el.length != 0) {
            break
          }
        }
        return _el
      }

      const imgEl = find('.b-article-md__image img', '.b-article__image img')
      const imgSrcSet = $(imgEl).attr('srcset') || $(imgEl).attr('data-srcset')
      const imgHref = imgSrcSet
        ? getBestResolutionImg(imgSrcSet)
        : $(imgEl).attr('src') || $(imgEl).attr('data-src')
      const titleEl = find('.b-article-md__title a', '.b-article__title a')
      const title = $(titleEl).text()
      const href = $(titleEl).attr('href')
      const previewTextEl = find('.b-article-md__excerpt', '.b-article__excerpt')
      const previewText = $(previewTextEl).text().trim()
      const publishedEl = $(el).find('time')
      const publishedAt = $(publishedEl).attr('datetime')
      const labels = Array.from(
        new Set(
          $(el)
            .find('.labels a')
            .map((_, _el) => {
              return $(_el).text()
            })
            .get()
        )
      ).sort()

      return { imgHref, title, href, previewText, publishedAt, labels }
    })
    .get()

  list = [...top, ...list]

  list.reverse()

  const getPostDetail = async (post) => {
    let meta = null
    try {
      const response = await fetch(post.href)
      const html = await response.text()
      const $ = cheerio.load(html)
      meta = $('.b-content__bd').text().trim()
    } catch (err) {}
    return {
      ...post,
      meta,
    }
  }

  const detailed = await Promise.all(list.map(getPostDetail))
  return detailed
}
