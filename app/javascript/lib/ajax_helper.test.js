delete window.location

window.location = {
  pathname: "/monsoon3/cc-demo/object-storage-ng/containers",
  href: "https://server2.com/monsoon3/cc-demo/object-storage-ng/containers",
  replace: vi.fn(),
}

const meta = document.createElement("meta")
meta.setAttribute("name", "csrf-token")
meta.setAttribute("content", "CSRF-TOKEN")
document.head.append(meta)

// use require instead of import because of the window object.
// we want to mock this object before loading the ajax helper
// imports are automatically moved to the top by js.
let { scope, ajaxHelper, configureAjaxHelper, pluginAjaxHelper, createAjaxHelper } = require("./ajax_helper")

const ACTIONS = ["head", "get", "post", "put", "patch", "copy", "delete"]

const originFetch = global.fetch || window.fetch
describe("client", () => {
  beforeEach(() => {
    // mock fetch function
    window.fetch = vi.fn(() => {
      const data = { name: "test" }

      return Promise.resolve({
        json: vi.fn(() => Promise.resolve(data)),
        blob: vi.fn(() => {
          const blob = new Blob([JSON.stringify(data)], {
            type: "application/json",
          })
          blob.text = vi.fn().mockResolvedValue(JSON.stringify(data))
          return Promise.resolve(blob)
        }),
        text: vi.fn().mockResolvedValue(JSON.stringify(data)),
        formData: vi.fn(() => Promise.resolve(new FormData())),
        ok: true,
        status: 200,
        statusText: "success",
        headers: new Headers({
          test: "test",
          "Content-Type": "application/json; charset=utf-8",
        }),
      })
    })
  })

  afterAll(() => (global.fetch = window.fetch = originFetch))

  describe("url", () => {
    it("respond to", () => {
      const client = createAjaxHelper()
      expect(client.url).toBeDefined()
    })
  })

  describe("bad config keys", () => {
    it("should throw an error", () => {
      expect(() => {
        createAjaxHelper({ badKey1: "", badKey2: "" })
      }).toThrow()
    })
  })
  describe("valid config keys", () => {
    it("should not throw an error", () => {
      expect(() => {
        createAjaxHelper({
          baseURL: "",
          headers: "",
          pathPrefix: "",
          headerPrefix: "",
        })
      }).not.toThrow()
    })
  })

  describe("response", () => {
    let client
    beforeAll(() => (client = createAjaxHelper()))

    ACTIONS.forEach((action) => {
      describe("success", () => {
        it(action + ":  " + "should return a response object", async () => {
          await expect(client[action]("test")).resolves.toEqual(
            expect.objectContaining({
              status: 200,
              data: { name: "test" },
              headers: {
                test: "test",
                "content-type": "application/json; charset=utf-8",
              },
            })
          )
        })
      })

      describe("redirect to login", () => {
        it(action + ": " + "should redirect to login if after_login location presented", async () => {
          window.fetch = vi.fn(() =>
            Promise.resolve({
              json: vi.fn(() => Promise.resolve(null)),
              blob: vi.fn(() => {
                const blob = new Blob([JSON.stringify(null)], {
                  type: "application/json",
                })
                blob.text = vi.fn().mockResolvedValue(JSON.stringify(null))
                return Promise.resolve(blob)
              }),
              text: vi.fn(() => Promise.resolve(null)),
              formData: vi.fn(() => Promise.resolve(new FormData())),
              ok: true,
              status: 200,
              statusText: "success",
              headers: new Headers({
                location: "https://server1.com/login?after_login=http://test1.com",
              }),
            })
          )

          await client[action]("test")
          expect(window.location.replace).toHaveBeenLastCalledWith(
            `https://server1.com/login?after_login=${encodeURIComponent(
              "https://server2.com/monsoon3/cc-demo/object-storage-ng/containers"
            )}`
          )
        })

        it("should redirect to login if auth/login location presented", async () => {
          window.fetch = vi.fn(() =>
            Promise.resolve({
              json: vi.fn(() => Promise.resolve(null)),
              blob: vi.fn(() => {
                const blob = new Blob([JSON.stringify(null)], {
                  type: "application/json",
                })
                blob.text = vi.fn().mockResolvedValue(JSON.stringify(null))
                return Promise.resolve(blob)
              }),
              text: vi.fn().mockResolvedValue(JSON.stringify(null)),
              formData: vi.fn(() => Promise.resolve(new FormData())),
              ok: true,
              status: 200,
              statusText: "success",
              headers: new Headers({
                location: "https://server1.com/auth/login",
              }),
            })
          )

          await client[action]("test")
          expect(window.location.replace).toHaveBeenLastCalledWith(
            `https://server1.com/auth/login?after_login=${encodeURIComponent(
              "https://server2.com/monsoon3/cc-demo/object-storage-ng/containers"
            )}`
          )
        })
      })

      describe("error", () => {
        beforeEach(() => {
          window.fetch = vi.fn(() => {
            const data = { error: "name can not be empty" }
            return Promise.resolve({
              json: vi.fn().mockResolvedValue(JSON.stringify(data)),
              blob: vi.fn(() => {
                const blob = new Blob([JSON.stringify(data)], {
                  type: "application/json",
                })
                blob.text = vi.fn().mockResolvedValue(JSON.stringify(data))
                return Promise.resolve(blob)
              }),
              text: vi.fn().mockResolvedValue(JSON.stringify(data)),
              formData: vi.fn().mockResolvedValue(new FormData()),
              ok: false,
              status: 400,
              statusText: "bad request",
              headers: new Headers({
                test: "test",
              }),
            })
          })
        })

        it(action + ": " + "should throw an error", async () => {
          await expect(client[action]("test")).rejects.toMatchObject({
            message: "name can not be empty",
            status: 400,
            statusText: "Bad Request",
            data: { error: "name can not be empty" },
          })
        })
      })
    })
  })

  describe("timeout", () => {
    ACTIONS.forEach((action) => {
      it(action + ": " + "use timeout option", () => {
        createAjaxHelper({ timeout: 60 })[action]("test")
        expect(fetch).toHaveBeenLastCalledWith(
          expect.anything(),
          expect.objectContaining({ signal: expect.anything() })
        )
      })
    })
  })

  describe("cancelable", () => {
    ACTIONS.forEach((action) => {
      it(action + ": " + "cancelable", () => {
        const result = createAjaxHelper({ timeout: 60 }).cancelable[action]("test")
        expect(result.request).toBeDefined()
        expect(result.request instanceof Promise).toEqual(true)
        expect(result.cancel).toBeDefined()
        expect(typeof result.cancel).toEqual("function")
      })
    })
  })

  describe("path", () => {
    let client
    ACTIONS.forEach((action) => {
      // path with leading and tail slashes
      beforeAll(() => (client = createAjaxHelper()))
      it(action + ": " + "should not modify path", () => {
        client[action]("test")
        expect(fetch).toHaveBeenLastCalledWith("test", expect.anything())
      })

      it(action + ": " + "should respect leading slash", () => {
        client[action]("/test")
        expect(fetch).toHaveBeenLastCalledWith("/test", expect.anything())
      })

      it(action + ": " + "should respect leading and tail slash", () => {
        client[action]("/test/")
        expect(fetch).toHaveBeenLastCalledWith("/test/", expect.anything())
      })

      // os api
      describe("osApi", () => {
        it(action + ": " + "should preset prefix os-api/SERVICE_NAME", () => {
          client.osApi("compute")[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("os-api/compute/test", expect.anything())
        })

        it(action + ": " + "should respect leading and tail slash", () => {
          client.osApi("compute")[action]("/test/")
          expect(fetch).toHaveBeenLastCalledWith("os-api/compute/test/", expect.anything())
        })
      })

      // baseURL
      describe("baseURL", () => {
        it(action + ": " + "should preset baseURL", () => {
          const client = createAjaxHelper({ baseURL: "http://test.com/" })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("http://test.com/test", expect.anything())
        })

        it(action + ": " + "should preset baseURL and add pathPrefix", () => {
          const client = createAjaxHelper({
            baseURL: "http://test.com/",
            pathPrefix: "v2",
          })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("http://test.com/v2/test", expect.anything())
        })

        // baseURL
        describe("osApi", () => {
          it(action + ": " + "should preset baseURL and add os-api prefix", () => {
            const client = createAjaxHelper({
              baseURL: "http://test.com/",
            }).osApi("compute")
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("http://test.com/os-api/compute/test", expect.anything())
          })

          it(action + ": " + "should preset baseURL and add os-api and pathPrefix", () => {
            const client = createAjaxHelper({
              baseURL: "http://test.com/",
              pathPrefix: "v2",
            }).osApi("compute")
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("http://test.com/os-api/compute/v2/test", expect.anything())
          })

          it(action + ": " + "should override baseURL", () => {
            const client = createAjaxHelper({
              baseURL: "http://test.com/",
            }).osApi("compute", { baseURL: "https://osApi.com" })
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("https://osApi.com/os-api/compute/test", expect.anything())
          })
          it(action + ": " + "should override baseURL and pathPrefix", () => {
            const client = createAjaxHelper({
              baseURL: "http://test.com/",
              pathPrefix: "v2",
            }).osApi("compute", {
              baseURL: "https://osApi.com",
              pathPrefix: "",
            })
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("https://osApi.com/os-api/compute/test", expect.anything())
          })
        })
      })

      if (["post", "put", "patch"].indexOf(action) >= 0) {
        describe("values", () => {
          it(action + ": " + "should convert values to json by default", () => {
            const client = createAjaxHelper()
            client[action]("test", { name: "test", date: "now" })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                body: JSON.stringify({ name: "test", date: "now" }),
              })
            )
          })

          it(action + ": " + "should not convert values if formdata", () => {
            const client = createAjaxHelper()
            const formData = new FormData()
            formData.append("name", "test")

            client[action]("test", formData)
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                body: formData,
              })
            )
          })

          it(action + ": " + "should not convert values if string", () => {
            const client = createAjaxHelper()
            client[action]("test", "name=test")
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                body: "name=test",
              })
            )
          })

          it(action + ": " + "should not convert values if file", () => {
            const client = createAjaxHelper()
            const file = new File([], "test")
            client[action]("test", file)
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                body: file,
              })
            )
          })
        })
      }

      describe("params", () => {
        it(action + ": " + "should add header prefix", () => {
          const client = createAjaxHelper({
            params: { test1: "test", test2: "test" },
          })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("test?test1=test&test2=test", expect.anything())
        })

        describe("osApi", () => {
          it(action + ": " + "should add header prefix", () => {
            const client = createAjaxHelper({
              params: { test1: "test", test2: "test" },
            }).osApi("compute")
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("os-api/compute/test?test1=test&test2=test", expect.anything())
          })
        })
      })

      describe("headerPrefix", () => {
        it(action + ": " + "should add header prefix", () => {
          const client = createAjaxHelper({
            headerPrefix: "X-",
            headers: { test1: "test1", test2: "test2" },
          })
          client[action]("test")

          const expectedHeaders = {
            "X-test1": "test1",
            "X-test2": "test2",
            "x-csrf-token": "CSRF-TOKEN",
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json; charset=utf-8",
          }

          expect(fetch).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({
              headers: expectedHeaders,
            })
          )
        })

        it(action + ": " + "should add a new header and header prefix ", () => {
          const client = createAjaxHelper({
            headerPrefix: "X-",
            headers: { test1: "test1" },
            nonPrefixHeaders: { test2: "test2" },
          })
          if (["post", "put", "patch"].indexOf(action) >= 0) {
            client[action]("test", {}, { headers: { test3: "test3" } })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                headers: {
                  "X-test1": "test1",
                  test2: "test2",
                  "X-test3": "test3",
                  "x-csrf-token": "CSRF-TOKEN",
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json; charset=utf-8",
                  "X-content-type": "application/json",
                },
              })
            )
          } else {
            client[action]("test", { headers: { test3: "test3" } })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                headers: {
                  "X-test1": "test1",
                  test2: "test2",
                  "X-test3": "test3",
                  "x-csrf-token": "CSRF-TOKEN",
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json; charset=utf-8",
                },
              })
            )
          }
        })

        it(action + ": " + "should override header prefix ", () => {
          const client = createAjaxHelper({
            headerPrefix: "X-",
            headers: { test1: "test1" },
          })
          if (["post", "put", "patch"].indexOf(action) >= 0) {
            client[action]("test", {}, { headerPrefix: "Y-" })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                headers: {
                  "Y-test1": "test1",
                  "x-csrf-token": "CSRF-TOKEN",
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json; charset=utf-8",
                  "Y-content-type": "application/json",
                },
              })
            )
          } else {
            client[action]("test", { headerPrefix: "Y-" })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                headers: {
                  "Y-test1": "test1",
                  "x-csrf-token": "CSRF-TOKEN",
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json; charset=utf-8",
                },
              })
            )
          }
        })

        it(action + ": " + "should ignore non proxy headers", () => {
          const client = createAjaxHelper({
            headerPrefix: "X-",
            headers: { test1: "test1" },
          })
          if (["post", "put", "patch"].indexOf(action) >= 0) {
            client[action]("test", {}, { headers: { test2: "test2" } })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                headers: {
                  "X-test1": "test1",
                  "X-test2": "test2",
                  "x-csrf-token": "CSRF-TOKEN",
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json; charset=utf-8",
                  "X-content-type": "application/json",
                },
              })
            )
          } else {
            client[action]("test", {
              headers: {
                test2: "test2",
              },
            })
            expect(fetch).toHaveBeenLastCalledWith(
              expect.anything(),
              expect.objectContaining({
                headers: {
                  "X-test1": "test1",
                  "X-test2": "test2",
                  "x-csrf-token": "CSRF-TOKEN",
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json; charset=utf-8",
                },
              })
            )
          }
        })
      })

      describe("pathPrefix", () => {
        it(action + ": " + "should set global prefix", () => {
          const client = createAjaxHelper({ pathPrefix: "v2" })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("v2/test", expect.anything())
        })

        it(action + ": " + "should respect leading prefix slash", () => {
          const client = createAjaxHelper({ pathPrefix: "/v2" })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("/v2/test", expect.anything())
        })

        it(action + ": " + "should ignore tail slash", () => {
          const client = createAjaxHelper({ pathPrefix: "v2/" })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("v2/test", expect.anything())
        })

        it(action + ": " + "should respect leading slash and ignore tail slash", () => {
          const client = createAjaxHelper({ pathPrefix: "/v2/" })
          client[action]("test")
          expect(fetch).toHaveBeenLastCalledWith("/v2/test", expect.anything())
        })

        describe("osApi", () => {
          it(action + ": " + "should add pathPrefix after os-api prefix", () => {
            const client = createAjaxHelper({ pathPrefix: "v2" }).osApi("compute")
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("os-api/compute/v2/test", expect.anything())
          })

          it(action + ": " + "should ignore leading slash of pathPrefix", () => {
            const client = createAjaxHelper({ pathPrefix: "/v2" }).osApi("compute")
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("os-api/compute/v2/test", expect.anything())
          })

          it(action + ": " + "should ignore leading and tail slash of pathPrefix", () => {
            const client = createAjaxHelper({ pathPrefix: "/v2/" }).osApi("compute")
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("os-api/compute/v2/test", expect.anything())
          })

          it(action + ": " + "should override pathPrefix", () => {
            const client = createAjaxHelper({ pathPrefix: "/v2/" }).osApi("compute", { pathPrefix: "v3" })
            client[action]("test")
            expect(fetch).toHaveBeenLastCalledWith("os-api/compute/v3/test", expect.anything())
          })
        })
      })
    })
  })
})

describe("ajaxHelper", () => {
  it("should be defined", () => {
    configureAjaxHelper({})
    ajaxHelper = require("./ajax_helper")
    expect(ajaxHelper).toBeDefined()
  })
})

describe("configureAjaxHelper", () => {
  it("should be defined", () => {
    expect(configureAjaxHelper).toBeDefined()
  })
  it("should be a function", () => {
    expect(typeof configureAjaxHelper).toEqual("function")
  })

  ACTIONS.forEach((action) => {
    it(action + ": " + "should be defined", () => {
      expect(configureAjaxHelper()[action]).toBeDefined()
    })
  })
})

describe("pluginAjaxHelper", () => {
  it("should be defined", () => {
    expect(pluginAjaxHelper).toBeDefined()
  })
  it("should be a function", () => {
    expect(typeof pluginAjaxHelper).toEqual("function")
  })
})

describe("scope", () => {
  it("should be defined", () => {
    expect(scope).toBeDefined()
  })
  it("should resolve current scoped domain", () => {
    expect(scope.domain).toEqual("monsoon3")
  })

  it("should resolve current scoped project", () => {
    expect(scope.project).toEqual("cc-demo")
  })
})
