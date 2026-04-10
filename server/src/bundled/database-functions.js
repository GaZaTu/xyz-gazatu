/**
 * @param {string} id
 */
export function __delete_blog_entry_image(id) {
  const imagePath = `${Deno.env.get("BLOG_ENTRY_IMAGES_DIR")}/${id}`
  const previewPath = `${Deno.env.get("BLOG_ENTRY_PREVIEWS_DIR")}/${id}`

  try {
    Deno.removeSync(imagePath)
    Deno.removeSync(previewPath)
  } catch {
    // ignore
  }
}
