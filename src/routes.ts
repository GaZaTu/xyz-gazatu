import { RouteDefinition, useLocation, useParams } from "@solidjs/router"
import { Accessor, createMemo, lazy, mergeProps } from "solid-js"

const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(() => import("./pages/Home")),
  },
  {
    path: "/login",
    component: lazy(() => import("./pages/Login")),
  },
  {
    path: "/logout",
    component: lazy(() => import("./pages/Logout")),
  },
  {
    path: "/reset-password",
    component: lazy(() => import("./pages/ResetPassword")),
  },
  {
    path: "/meta/users",
    component: lazy(() => import("./pages/meta/UserList")),
  },
  {
    path: "/meta/users/:id",
    component: lazy(() => import("./pages/meta/User")),
  },
  {
    path: "/profile",
    component: lazy(() => import("./pages/meta/User")),
  },
  {
    path: "/trivia/categories",
    component: lazy(() => import("./pages/trivia/TriviaCategoryList")),
  },
  {
    path: "/trivia/categories/:id",
    component: lazy(() => import("./pages/trivia/TriviaCategory")),
  },
  {
    path: "/trivia/questions",
    component: lazy(() => import("./pages/trivia/TriviaQuestionList")) as any,
  },
  {
    path: "/trivia/questions/:id",
    component: lazy(() => import("./pages/trivia/TriviaQuestion")),
  },
  {
    path: "/trivia/reports",
    component: lazy(() => import("./pages/trivia/TriviaReportList")) as any,
  },
  {
    path: "/blog/gallery",
    component: lazy(() => import("./pages/blog/BlogGallery")),
  },
  {
    path: "/trading/chart",
    component: lazy(() => import("./pages/trading/Chart")),
  },
  {
    path: "/meta/sql",
    component: lazy(() => import("./pages/meta/SQL")),
  },
  {
    path: "/meta/server-load",
    component: lazy(() => import("./pages/meta/ServerLoad")),
  },
  {
    path: "/meta/audit-log",
    component: lazy(() => import("./pages/meta/AuditLog")),
  },
  {
    path: "/meta/password-reset-requests",
    component: lazy(() => import("./pages/meta/PasswordResetRequestList")),
  },
  {
    path: "/oidc-consent",
    component: lazy(() => import("./pages/OIDCConsent")),
  },
  {
    path: "**",
    component: lazy(() => import("./pages/Http404")),
  },
]

export default routes

export const createResolvedRoutePath = (suppliedParams: Accessor<Record<string, string>>) => {
  const location = useLocation()
  const locationParams = useParams()
  const params = createMemo(() => {
    return mergeProps(locationParams, suppliedParams())
  })

  const resolvedRoutePath = createMemo(() => {
    const dirname = (path: string) => {
      return path.slice(0, path.lastIndexOf("/"))
    }

    const resolvedLocationPath = [] as { pathname: string, routePath: string, info: Record<string, unknown>, active: boolean }[]

    const _params = params()

    let routePath = location.pathname
    for (const [k, v] of Object.entries(_params)) {
      routePath = routePath.replace(v, `:${k}`)
    }

    while (routePath) {
      for (const route of routes) {
        if (route.path === routePath) {
          const pathname = (() => {
            let pathname = route.path
            for (const [k, v] of Object.entries(_params)) {
              pathname = pathname.replace(`:${k}`, v)
            }
            return pathname
          })()
          const info = route.info ?? {}
          const active = !resolvedLocationPath.length

          resolvedLocationPath.unshift({ pathname, routePath, info, active })
          break
        }
      }

      routePath = dirname(routePath)
    }

    return resolvedLocationPath
  })

  return resolvedRoutePath
}
