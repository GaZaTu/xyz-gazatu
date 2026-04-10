/// <reference lib="WebWorker" />

/** @type {ServiceWorkerGlobalScope} */
const worker = self

worker.addEventListener("push", event => {
  /** @type {{ title: string, message: string, url?: string }} */
  const data = event.data?.json() ?? {}

  worker.registration.showNotification(data.title, {
    body: data.message,
    data: {
      url: data.url,
    },
  })
})

worker.addEventListener("notificationclick", event => {
  event.notification.close()

  event.waitUntil((async () => {
    if (event.notification.data.url) {
      await worker.clients.openWindow(event.notification.data.url)
    }
  })())
})
