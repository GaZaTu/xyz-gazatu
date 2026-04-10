import sharp from "npm:sharp@^0.34.3"
import { appdataDir, Complexity, gqlclass, gqlResolver, nullable, paginationOf, RunTyped, sqlclass } from "gazatu-api-lib"
import { SchemaContext, SchemaFields } from "../schema.ts"
import { assertAuth } from "../auth.ts"
import { database } from "../database.ts"

const filenameRegexp = /[^\w\d\.\-\_]/gm

@sqlclass()
@gqlclass()
export class BlogEntry {
  @RunTyped.field(String, {
    sql: { pk: true },
    gql: { optional: true },
  })
  id!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  story!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  title!: string

  @RunTyped.field(nullable(String), {
    sql: {},
    gql: {},
  })
  message?: string | null

  @RunTyped.field(File, {
    gql: { only: "input" },
  })
  image?: File

  @gqlclass.resolver({
    type: String,
    resolve: (self: BlogEntry, args, ctx: SchemaContext) => {
      // let filename = `${self.story}-${self.title}.webp`
      // filename = filename.replaceAll(filenameRegexp, () => "_")

      return `/blog/entries/${self.id}/image.webp`
    },
  })
  imageLocation?: string

  @gqlclass.resolver({
    type: String,
    resolve: (self: BlogEntry, args, ctx: SchemaContext) => {
      return `/blog/entries/${self.id}/preview.webp`
    },
  })
  previewLocation?: string

  @RunTyped.field(String, {
    sql: {},
    gql: { only: "output" },
  })
  createdAt!: string

  @RunTyped.field(String, {
    sql: {},
    gql: { only: "output" },
  })
  updatedAt!: string
}

export const BlogEntryResolver: SchemaFields = {
  Query: {
    uploadedFiles: gqlResolver({
      type: paginationOf(BlogEntry),
      args: {},
      resolve: async (_, args, ctx, info) => {
      },
      description: "/",
      extensions: {
        complexity: Complexity.DEFAULT,
      },
    }),
  },
  Mutation: {
    blogEntrySave: gqlResolver({
      type: BlogEntry,
      args: {
        input: {
          type: BlogEntry,
        },
      },
      resolve: async (_, { input }, ctx) => {
        await assertAuth(ctx.request, ["admin"])

        const blogEntry = await database
          .store(BlogEntry, input, await ctx.dbenv)

        try {
          const imageBuffer = await input.image!.arrayBuffer()

          await sharp(imageBuffer)
            .rotate()
            .webp({ effort: 6, quality: 85, lossless: true })
            .toFile(`${BLOG_ENTRY_IMAGES_DIR}/${blogEntry.id}`)

          await sharp(imageBuffer)
            .resize(256)
            .rotate()
            .webp({ effort: 6, quality: 50 })
            .toFile(`${BLOG_ENTRY_PREVIEWS_DIR}/${blogEntry.id}`)
        } catch (error) {
          await database
            .deleteOne(BlogEntry, await ctx.dbenv)
            .byId(blogEntry.id)

          throw error
        }

        return blogEntry
      },
      description: "/",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
  },
}

export const BLOG_ENTRY_IMAGES_DIR = `${appdataDir}/data/blog/images`
Deno.mkdirSync(BLOG_ENTRY_IMAGES_DIR, { recursive: true })
Deno.env.set("BLOG_ENTRY_IMAGES_DIR", BLOG_ENTRY_IMAGES_DIR)

export const BLOG_ENTRY_PREVIEWS_DIR = `${appdataDir}/data/blog/previews`
Deno.mkdirSync(BLOG_ENTRY_IMAGES_DIR, { recursive: true })
Deno.env.set("BLOG_ENTRY_PREVIEWS_DIR", BLOG_ENTRY_PREVIEWS_DIR)
