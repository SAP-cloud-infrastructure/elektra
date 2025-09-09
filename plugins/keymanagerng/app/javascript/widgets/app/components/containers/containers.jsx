import React, { useState, useEffect } from "react"
import { policy } from "lib/policy"
import ContainerList from "./containerList"
import Pagination from "../Pagination"
import { getContainers } from "../../containerActions"
import { useQuery } from "@tanstack/react-query"
import {
  Container,
  IntroBox,
  SearchInput,
  DataGridToolbar,
  ButtonRow,
  Button,
  Stack,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@cloudoperators/juno-ui-components"
import { Link } from "react-router-dom"
import { useActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import useContainersSearch from "../../hooks/useContainersSearch"
import { useLocation } from "react-router-dom"

const ITEMS_PER_PAGE = 20

const Containers = () => {
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

  const search = useContainersSearch({ text: searchTerm })
  
  // Pass the reset function to child components
  const resetSearch = search.reset
  
  const { isLoading, isFetching, data, error } = useQuery({
    queryKey: ["containers", paginationOptions],
    queryFn: getContainers,
  })

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
          The containers resource is the organizational center piece of
          barbican. It creates a logical object that can be used to hold secret
          references. This is helpful when having to deal with tracking and
          having access to hundreds of secrets. For more information visit
          the&nbsp;
          <a href="http://developer.openstack.org/api-guide/key-manager/containers.html">
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
              <>
                <Button
                  label="Cancel fetching..."
                  onClick={onSearchCancel}
                  progress
                  progressLabel="Cancel fetching..."
                  variant="subdued"
                />
                <Spinner variant="primary" />
              </>
            )}
          </Stack>
        }
      >
        <ButtonRow>
          {policy.isAllowed("keymanagerng:container_create") ? (
            <Link to="/containers/newContainer">
              <Button>New Container</Button>
            </Link>
          ) : (
            <Tooltip triggerEvent="hover">
              <TooltipTrigger asChild>
                <span>
                  <Button disabled>New Container</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                You do not have permission to create containers. Your user
                account requires the keymanager_admin role.
              </TooltipContent>
            </Tooltip>
          )}
        </ButtonRow>
      </DataGridToolbar>
      <ContainerList
        containers={
          search.isFiltering ? search.displayResults : data?.containers
        }
        isLoading={isLoading}
        resetSearch={resetSearch} // Add this line
      />
      {!search.isFiltering && data?.containers?.length > 0 && (
        <Pagination
          count={data?.total}
          limit={ITEMS_PER_PAGE}
          onChanged={onPaginationChanged}
          isFetching={isFetching || data?.containers?.length === 0}
          disabled={error}
          currentPage={currentPage}
        />
      )}
    </Container>
  )
}

export default Containers
