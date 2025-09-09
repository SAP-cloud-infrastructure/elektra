import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useHistory } from "react-router-dom"
import { 
  Button, 
  Container, 
  IntroBox, 
  DataGridToolbar, 
  ButtonRow,
  SearchInput,
  Stack,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@cloudoperators/juno-ui-components"
import { getOrders } from "../../orderActions"
import OrderList from "./orderList"
import Pagination from "../Pagination"
import useStore from "../../store"
import { policy } from "lib/policy"
import { useActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import useOrdersSearch from "../../hooks/useOrdersSearch"
import { useLocation } from "react-router-dom"

const ITEMS_PER_PAGE = 20

const Orders = () => {
  const history = useHistory()
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
  const setShowNewOrder = useStore((state) => state.setShowNewOrder)

  const search = useOrdersSearch({ text: searchTerm })

  // Pass the reset function to child components
  const resetSearch = search.reset

  const { data: ordersData, isLoading, isFetching, error } = useQuery({
    queryKey: ["orders", paginationOptions],
    queryFn: getOrders,
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

  const handleCreateOrder = () => {
    setShowNewOrder(true)
    history.push("/orders/newOrder")
  }

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

  if (error) {
    return (
      <Container py px={false}>
        <div className="alert alert-danger" role="alert">
          Error loading orders: {error.message}
        </div>
      </Container>
    )
  }

  return (
    <Container py px={false}>
      <IntroBox>
        <p>
        The orders resource allows the user to request barbican to generate a secret.
        This is also very helpful for requesting the creation of public/private key pairs. For
          more information, visit the&nbsp;
          <a href="http://developer.openstack.org/api-guide/key-manager/orders.html">
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
          {policy.isAllowed("keymanagerng:order_create") ? (
            <Button onClick={handleCreateOrder}>
              New Order
            </Button>
          ) : (
            <Tooltip triggerEvent="hover">
              <TooltipTrigger asChild>
                <span>
                  <Button disabled>New Order</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                You do not have permission to create orders. Your user
                account requires the keymanager_admin role.
              </TooltipContent>
            </Tooltip>
          )}
        </ButtonRow>
      </DataGridToolbar>

      <OrderList 
        orders={
          search.isFiltering ? search.displayResults : ordersData?.orders
        }
        isLoading={isLoading}
        resetSearch={resetSearch} // Pass reset function
      />
      {!search.isFiltering && ordersData?.orders && ordersData.orders.length > 0 && (
        <Pagination
          count={ordersData.total}
          limit={ITEMS_PER_PAGE}
          onChanged={onPaginationChanged}
          isFetching={isFetching || ordersData.orders.length === 0}
          disabled={error}
          currentPage={currentPage}
        />
      )}
    </Container>
  )
}

export default Orders 