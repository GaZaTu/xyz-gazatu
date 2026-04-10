import { Router } from "@oak/oak"
import { BLOG_ENTRY_IMAGES_DIR, BLOG_ENTRY_PREVIEWS_DIR } from "./BlogEntry.ts"

export const uploadsRouter = new Router()

uploadsRouter.get("/blog/entries/:id/image.:ext", async ctx => {
  await ctx.send({
    root: BLOG_ENTRY_IMAGES_DIR,
    path: ctx.params.id,
    immutable: true,
  })
})

uploadsRouter.get("/blog/entries/:id/preview.:ext", async ctx => {
  await ctx.send({
    root: BLOG_ENTRY_PREVIEWS_DIR,
    path: ctx.params.id,
    immutable: true,
  })
})
