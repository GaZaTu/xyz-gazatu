import { Empty } from "@gazatu/solid-spectre/ui/Empty"
import { useNavigate } from "@solidjs/router"
import { Component, createEffect } from "solid-js"
import { setStoredAuth } from "../store/auth"

const LogoutView: Component = () => {
  const navigate = useNavigate()

  createEffect(() => {
    setStoredAuth(null)
    setTimeout(() => navigate("/"), 69)
  })

  return (
    <Empty>
      <Empty.Header>
        <h1>Logging you out...</h1>
      </Empty.Header>
    </Empty>
  )
}

export default LogoutView
