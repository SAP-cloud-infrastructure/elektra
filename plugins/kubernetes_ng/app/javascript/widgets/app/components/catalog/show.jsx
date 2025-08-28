import React from "react"
import {
  CodeBlock,
  ContentAreaToolbar,
  Message,
  Spinner,
  SearchInput,
} from "@cloudoperators/juno-ui-components"
import apiClient from "../../apiClient"
import { useGlobalState } from "../StateProvider"

const Catalog = () => {
  const [{ catalog: catalogState }, dispatch] = useGlobalState()

  React.useEffect(() => {
    if (catalogState.loaded || catalogState.isFetching) return
    dispatch({ type: "@catalog/request" })
    apiClient
      .osApi("identity")
      .get("auth/catalog")
      .then((response) => response.data)
      .then((data) =>
        dispatch({ type: "@catalog/receive", catalog: data.catalog })
      )
      .catch((e) => dispatch({ type: "@catalog/error", error: e.message }))
  }, [dispatch, catalogState])

  const services = React.useMemo(() => {
    if (
      !catalogState.searchTerm ||
      catalogState.searchTerm === "" ||
      !catalogState.catalog
    )
      return catalogState.catalog

    return catalogState.catalog.filter(
      (service) =>
        service.name.indexOf(catalogState.searchTerm) >= 0 ||
        service.type.indexOf(catalogState.searchTerm) >= 0
    )
  }, [catalogState.catalog, catalogState.searchTerm])

  return (
    <>
      <ContentAreaToolbar>
        <SearchInput
          value={catalogState.searchTerm || ""}
          onChange={(e) =>
            dispatch({ type: "@catalog/search", value: e.target.value })
          }
          onClear={() => dispatch({ type: "@catalog/search", value: null })}
        />
      </ContentAreaToolbar>
      <CodeBlock size="large">
        {catalogState.error && (
          <Message
            onDismiss={function noRefCheck() {}}
            text={state.error}
            variant="error"
          />
        )}
        {catalogState.isFetching ? (
          <Spinner variant="primary" />
        ) : services ? (
          <>{JSON.stringify(services, null, 2)}</>
        ) : (
          "No catalog available"
        )}
      </CodeBlock>
    </>
  )
}

export default Catalog
