import React from "react"
import { useState } from "react"
import { BrowserRouter, Route } from "react-router-dom"
import { widgetBasePath } from "lib/widget"
import List from "./List"

const baseName = widgetBasePath("kubernetes_ng")

const AppRouter = () => {
  return (
    <>
      <BrowserRouter basename={baseName}>
        <Route path="/" render={() => <List />} />
      </BrowserRouter>
    </>
  )
}

export default AppRouter
