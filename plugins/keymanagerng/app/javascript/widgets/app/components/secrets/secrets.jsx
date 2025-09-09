import React, { useState, useEffect } from "react"
import { policy } from "lib/policy"
import SecretList from "./secretList"
import Pagination from "../Pagination"
import { getSecrets } from "../../secretActions"
import { useQuery } from "@tanstack/react-query"
import {
  Container,
  IntroBox,
  SearchInput,
  DataGridToolbar,
  ButtonRow,
  Button,
  Stack,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@cloudoperators/juno-ui-components"
import { Link } from "react-router-dom"
import { useActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import useSecretsSearch from "../../hooks/useSecretsSearch"
import { useLocation } from "react-router-dom"

const ITEMS_PER_PAGE = 20

const Secrets = () => {
  const { addMessage } = useActions()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const page = query.get("page")
  const offset = (page - 1) * ITEMS_PER_PAGE // calculate the offset based on the page number
  const [paginationOptions, setPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0 || offset,
  })

  const { isLoading, isFetching, data, error } = useQuery({
    queryKey: ["secrets", paginationOptions],
    queryFn: getSecrets,
  })

  const search = useSecretsSearch({ text: searchTerm })

  // Pass the reset function to child components
  const resetSearch = search.reset

  // dispatch error with useEffect because error variable will first set once all retries did not succeed
  useEffect(() => {
    if (error) {
      addMessage({
        variant: "error",
        text: parseError(error),
      })
    }
  }, [error])

  const onPaginationChanged = (page) => {
    // todo check if page < 0
    setCurrentPage(page)
    const newOffset = (page - 1) * ITEMS_PER_PAGE
    setPaginationOptions({ ...paginationOptions, offset: newOffset })
  }

  const onChangeInput = (event) => {
    setSearchTerm(event.target.value)
  }

  const onSearchCancel = () => {
    search.cancel()
  }

  const onClear = () => {
    search.cancel()
    setSearchTerm("")
  }

  return (
    <Container py px={false}>
      <IntroBox>
        <p>
          The secrets resource is the heart of the Barbican service. It provides
          access to the secret/keying material stored in the system. Barbican
          supports the secure storage of data for various content types. For
          more information, visit the&nbsp;
          <a href="http://developer.openstack.org/api-guide/key-manager/secrets.html">
            Barbican OpenStack documentation.
          </a>
        </p>
      </IntroBox>

      <DataGridToolbar
        search={
          <Stack alignment="center">
            <SearchInput
              placeholder="Search by name or ID"
              onChange={onChangeInput}
              onClear={onClear}
            />
            {search.isFetching && (
              <Button
                label="Cancel fetching..."
                onClick={onSearchCancel}
                progress
                progressLabel="Cancel fetching..."
                variant="subdued"
              />
            )}
          </Stack>
        }
      >
        <ButtonRow>
          {policy.isAllowed("keymanagerng:secret_create") ? (
            <Link to="/secrets/newSecret">
              <Button>New Secret</Button>
            </Link>
          ) : (
            <Tooltip triggerEvent="hover">
              <TooltipTrigger asChild>
                <span>
                  <Button disabled>New Secret</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                You do not have permission to create secrets. Your user account
                requires the keymanager_admin role.
              </TooltipContent>
            </Tooltip>
          )}
        </ButtonRow>
      </DataGridToolbar>

      <SecretList
        secrets={
          search.isFiltering ? search.displayResults : data?.secrets
        }
        isLoading={isLoading}
        resetSearch={resetSearch} // Pass reset function
      />
      {!search.isFiltering && data?.secrets?.length > 0 && (
        <Pagination
          count={data?.total}
          limit={ITEMS_PER_PAGE}
          onChanged={onPaginationChanged}
          isFetching={isFetching}
          disabled={error || data?.secrets?.length === 0}
          currentPage={currentPage}
        />
      )}
    </Container>
  )
}

export default Secrets
