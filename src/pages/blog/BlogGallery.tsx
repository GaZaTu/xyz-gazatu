// css
import "./BlogGallery.scss"
// js
import { validator } from "@felte/validator-superstruct"
import { iconArrowLeft } from "@gazatu/solid-spectre/icons/iconArrowLeft"
import { iconArrowRight } from "@gazatu/solid-spectre/icons/iconArrowRight"
import { iconUpload } from "@gazatu/solid-spectre/icons/iconUpload"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Figure } from "@gazatu/solid-spectre/ui/Figure"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { Img } from "@gazatu/solid-spectre/ui/Img"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { LoadingPlaceholderImg } from "@gazatu/solid-spectre/ui/LoadingPlaceholder.Img"
import { Modal } from "@gazatu/solid-spectre/ui/Modal"
import { ModalComponent, ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { createTableState } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Timeline } from "@gazatu/solid-spectre/ui/Timeline"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { centerSelf } from "@gazatu/solid-spectre/util/position"
import { createIntersectionObserver } from "@solid-primitives/intersection-observer"
import { Title } from "@solidjs/meta"
import { useLocation } from "@solidjs/router"
import { Component, ComponentProps, createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { any, array, nullable, optional, size, string, type } from "superstruct"
import { defaultFetchInfo } from "../../lib/fetchFromApi"
import fetchGraphQL, { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { BlogEntry, BlogEntryInput, Mutation, Query } from "../../lib/schema.gql"
import superstructIsRequired from "../../lib/superstructIsRequired"
import { createAuthCheck } from "../../store/auth"

const BlogGalleryView: Component = () => {
  const isAdmin = createAuthCheck("admin")

  const [tableState, setTableState] = createTableState({
    pagination: {
      pageIndex: 0,
      pageSize: 50,
    },
  })

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($args: ListBlogEntriesArgs) {
        listBlogEntries(args: $args) {
          slice {
            id
            shortid
            story
            title
            message
            mediaType
            previewAspectRatio
            createdAt
          }
          pageCount
        }
      }
    `,
    variables: {
      args: {
        window: {
          get offset() {
            return (tableState.pagination?.pageIndex ?? 0) * (tableState.pagination?.pageSize ?? 0)
          },
          get limit() {
            return tableState.pagination?.pageSize ?? 0
          },
        },
      },
    },
    onError: Toaster.pushError,
    infinite: (prevData, nextData) => {
      const prev = prevData?.listBlogEntries
      const next = nextData.listBlogEntries

      // if ((tableState.pagination?.pageIndex ?? 0) === (next?.pageIndex ?? 0)) {
      //   return nextData
      // }

      next?.slice?.unshift(...(prev?.slice ?? []))
      return nextData
    },
  })

  createGlobalProgressStateEffect(() => resource.loading)

  const groups = createMemo(() => {
    return resource.data?.listBlogEntries?.slice
      ?.map((entry, index, entries) => {
        return {
          ...entry,
          prevEntryId: entries[index - 1]?.id,
          nextEntryId: entries[index + 1]?.id,
        }
      })
      ?.reduce((groups, entry) => {
        const date = new Date(entry.createdAt as any)
        const dateISOString = date.toISOString()
        const dateDay = dateISOString.slice(0, "yyyy-MM-dd".length)

        groups[dateDay] = groups[dateDay] ?? []
        groups[dateDay].push(entry as any)

        return groups
      }, {} as Record<string, LinkedBlogEntry[]>)
  })

  const [targets, setTargets] = createSignal<HTMLElement[]>([])
  createIntersectionObserver(targets, entries => {
    if (resource.loading || (tableState.pagination?.pageIndex ?? 0) >= (resource.data?.listBlogEntries?.pageCount ?? 0)) {
      return
    }

    const lastTarget = targets()[targets().length - 1]
    if (!lastTarget) {
      return
    }

    if (!entries.find(e => e.target === lastTarget)?.isIntersecting) {
      return
    }

    setTableState(state => ({
      ...state,
      pagination: {
        pageIndex: (state.pagination?.pageIndex ?? 0) + 1,
        pageSize: (state.pagination?.pageSize ?? 0),
      },
    }))
  })

  const handleUpload = async () => {
    await Toaster.try(async () => {
      await ModalPortal.push(BlogEntryUploadModal)

      resource.clear()
      resource.refresh()
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Column.Row>
          <Column>
            <Title>Blog</Title>
            <h3>Blog</h3>
          </Column>

          <Column xxl="auto" offset="ml">
            <Show when={isAdmin()}>
              <Button color="primary" action onclick={handleUpload}>
                <Icon src={iconUpload} />
              </Button>
            </Show>
          </Column>
        </Column.Row>
      </Section>

      <Section size="xl" marginY style={{ "padding-left": 0, "padding-right": "0.25rem" }}>
        <Timeline>
          <For each={Object.entries(groups() ?? {})}>
            {([date, entries]) => (
              <BlogEntryGroup ref={el => setTargets(s => [...s, el])} date={date} entries={entries} refresh={resource.refresh} />
            )}
          </For>
        </Timeline>
      </Section>
    </>
  )
}

export default BlogGalleryView

type LinkedBlogEntry = BlogEntry & {
  prevEntryId?: string
  nextEntryId?: string
}

type BlogEntryPreviewProps = {
  entry: LinkedBlogEntry
}

const BlogEntryPreview: Component<BlogEntryPreviewProps> = props => {
  // const isAdmin = createAuthCheck("admin")

  const location = useLocation()

  // const handleRemove = (id: string) => {
  //   return async () => {
  //     if (!await ModalPortal.confirm("Delete the selected blog entries?")) {
  //       return
  //     }

  //     await Toaster.try(async () => {
  //       await removeBlogEntries([id])
  //       response.refresh()
  //     })
  //   }
  // }

  createEffect(() => {
    if (location.query.entry !== props.entry.id) {
      return
    }

    ModalPortal.push(modal => (
      <Modal size="md" onclose={modal.resolve} oncloseHref="" active style={{ padding: "unset", "max-width": "1440px" }}>
        <Modal.Body style={{ padding: "unset", overflow: "unset" }}>
          <Figure class="blog-entry-image">
            <Button.A href="" params={{ entry: props.entry.prevEntryId }} onclick={modal.resolve} keepExistingParams class="go-left" disabled={!props.entry.prevEntryId} size="lg" action color="primary">
              <Icon src={iconArrowLeft} />
            </Button.A>
            <Button.A href="" params={{ entry: props.entry.nextEntryId }} onclick={modal.resolve} keepExistingParams class="go-right" disabled={!props.entry.nextEntryId} size="lg" action color="primary">
              <Icon src={iconArrowRight} />
            </Button.A>

            <Show when={props.entry.mediaType.startsWith("image")}>
              <Img src={`${defaultFetchInfo()}/media/${props.entry.shortid}.${props.entry.mediaType.split("/")[1]}`} alt="" responsive class={`${centerSelf(true)}`} />
            </Show>
            <Show when={props.entry.mediaType.startsWith("video")}>
              <video src={`${defaultFetchInfo()}/media/${props.entry.shortid}.${props.entry.mediaType.split("/")[1]}`} controls class={`${centerSelf(true)}`} />
            </Show>
            <Show when={props.entry.mediaType.startsWith("audio")}>
              <audio src={`${defaultFetchInfo()}/media/${props.entry.shortid}.${props.entry.mediaType.split("/")[1]}`} controls class={`${centerSelf(true)}`} />
            </Show>

            <Figure.Caption>
              <h4>{props.entry.story}</h4>
              <h5>{props.entry.title}</h5>
              <p style={{ "white-space": "pre-wrap" }}>{props.entry.message}</p>
            </Figure.Caption>
          </Figure>
        </Modal.Body>
      </Modal>
    ))
  })

  return (
    <Figure class="preview">
      <A href="" params={{ entry: props.entry.id }} keepExistingParams>
        <LoadingPlaceholderImg src={`${defaultFetchInfo()}/rest/v1/blog/previews/${props.entry.shortid}.webp`} alt="" responsive style={{ "--aspect-ratio": props.entry.previewAspectRatio ?? 0 }} />
      </A>
    </Figure>
  )
}

type BlogEntryGroupProps = {
  ref?: ComponentProps<typeof Timeline.Item>["ref"]
  date: string
  entries: LinkedBlogEntry[]
  refresh: () => void
}

const BlogEntryGroup: Component<BlogEntryGroupProps> = props => {
  return (
    <Timeline.Item ref={props.ref} id={props.date}>
      <h5>{props.date}</h5>
      <Column.Row gaps="md">
        <For each={props.entries}>
          {entry => (
            <Column xxl="auto" class="preview-column">
              <BlogEntryPreview entry={entry} />
            </Column>
          )}
        </For>
      </Column.Row>
    </Timeline.Item>
  )
}

// const BlogEntryGroupPlaceholder: Component = () => {
//   return (
//     <Section size="xl" marginY>
//       <h5>
//         <LoadingPlaceholder width="8rem" height="var(--line-height)" />
//       </h5>
//       <Column.Row gaps="md">
//         <For each={new Array(4)}>
//           {() => (
//             <Column class="preview-column">
//               <Figure class="preview">
//                 <ImgWithPlaceholder responsive style={{ "--width": 200, "--height": 200 }} />
//               </Figure>
//             </Column>
//           )}
//         </For>
//       </Column.Row>
//     </Section>
//   )
// }

const BlogEntryUploadSchema = type({
  files: size(array(any()), 1, 1),
  story: size(string(), 1, 128),
  title: size(string(), 1, 128),
  message: optional(nullable(size(string(), 0, 256))),
})

const createImageWebpBlob = async (source: ImageBitmapSource, options?: ImageBitmapOptions) => {
  const canvas = document.createElement("canvas")
  try {
    const bitmap = await createImageBitmap(source, options)

    canvas.width = bitmap.width
    canvas.height = bitmap.height

    canvas.getContext("bitmaprenderer")
      ?.transferFromImageBitmap(bitmap)

    const image = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, "image/webp")
    })

    return image!
  } finally {
    canvas.remove()
  }
}

const createImageWebpBlobFromVideo = async (source: Blob | MediaSource, options?: ImageBitmapOptions) => {
  const video = document.createElement("video")
  try {
    video.src = URL.createObjectURL(source)

    const image = await new Promise<Blob>(resolve => {
      video.requestVideoFrameCallback(async () => {
        resolve(await createImageWebpBlob(video, options))
      })
    })

    return image
  } finally {
    video.remove()
  }
}

const BlogEntryUploadModal: ModalComponent = modal => {
  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = BlogEntryUploadSchema
  const form = Form.createContext<BlogEntryInput & { files: File[] }>({
    extend: validator<any>({ struct: formSchema }),
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    transform: v => v as any,
    onSubmit: async input => {
      setSubmitting(true)
      try {
        const mediaFile = input.files[0]
        input.mediaFile = mediaFile
        input.files = []

        if (mediaFile.type.startsWith("video")) {
          const preview = await createImageWebpBlobFromVideo(mediaFile, {
            resizeQuality: "medium",
            resizeWidth: 256,
          })

          input.previewFile = new File([preview], "preview.webp", { type: preview.type })
        }

        await fetchGraphQL<Mutation>({
          query: gql`
          mutation ($input: BlogEntryInput!) {
            saveBlogEntry(input: $input) {
              id
            }
          }
        `,
          variables: { input },
        })

        modal.resolve()
        return "Created new blog entry"
      } finally {
        setSubmitting(false)
      }
    },
    onSuccess: Toaster.pushSuccess,
    onError: Toaster.pushError,
    initialValues: {
      story: new Date().toISOString().slice(0, "yyyy-MM-dd".length),
      title: new Date().toISOString().slice("yyyy-MM-dd".length + 1),
    },
  })

  return (
    <Modal onclose={modal.resolve} active>
      <Modal.Header>
        <h5>Add Blog Entry</h5>
      </Modal.Header>

      <Form context={form} horizontal>
        <Modal.Body>
          <Form.Group label="Media">
            <Input type="file" name="files" accept="*" />
          </Form.Group>

          <Form.Group label="Story">
            <Input type="text" name="story" ifEmpty={null} />
          </Form.Group>

          <Form.Group label="Title">
            <Input type="text" name="title" ifEmpty={null} />
          </Form.Group>

          <Form.Group label="Message">
            <Input type="text" name="message" ifEmpty={null} multiline style={{ "min-height": "calc(var(--control-height-md) * 2)" }} />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button type="submit" color="primary" onclick={form.createSubmitHandler()} loading={isSubmitting()}>OK</Button>
          <Button color="link" onclick={modal.resolve}>Cancel</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export const removeBlogEntries = async (ids: string[]) => {
  await fetchGraphQL<Mutation>({
    query: gql`
      mutation ($ids: [String!]!) {
        removeBlogEntries(ids: $ids)
      }
    `,
    variables: { ids },
  })
}
