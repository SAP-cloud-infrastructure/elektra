/**
 * Since we are accessing the window object, we use jsdom,
 * which emulates the browser
 * @jest-environment jsdom
 */

import { setupStore } from "testHelper"
import * as constants from "../../constants"
import { fetchProject } from "../../actions/project"
import { configureAjaxHelper } from "ajax_helper"

describe("fetchProject action", () => {
  let store
  let client
  const flushAllPromises = () => new Promise((resolve) => setTimeout(resolve))

  beforeEach(() => {
    store = setupStore({ object: { searchedValue: "a_project_id" } })
    client = configureAjaxHelper({ baseURL: "" })
  })

  it("fetches a project", async () => {
    const projectId = "a_project_id"
    client.get = vi.fn().mockResolvedValue({ data: { id: projectId }, headers: [] })

    // when
    store.dispatch(fetchProject("a_project_id", projectId))
    await flushAllPromises()
    // then
    expect(store.getActions().length).toEqual(2)
    expect(store.getActions()[0].type).toEqual(constants.REQUEST_PROJECT)
    expect(store.getActions()[1].type).toEqual(constants.RECEIVE_PROJECT)
    expect(store.getActions()[1].data).toEqual({ id: "a_project_id" })
  })

  it("reject project if it is not the same as was requested because of asynchronous requests", async () => {
    const projectId = "b_project_id"
    client.get = vi.fn().mockResolvedValue({ data: { id: "a_project_id" }, headers: [] })
    // when
    store.dispatch(fetchProject("b_project_id", projectId))
    await flushAllPromises()
    // then
    expect(store.getActions().length).toEqual(1)
    expect(store.getActions()[0].type).toEqual(constants.REQUEST_PROJECT)
  })
})
