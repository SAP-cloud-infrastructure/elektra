import { useState, useEffect } from "react"
import { fetchContainers } from "../containerActions"
import { useQuery } from "@tanstack/react-query"

const regexString = (string) => string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
const FETCH_LIMIT = 20

const useContainersSearch = ({ text }) => {
  const [isFetching, setIsFetching] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [fetchParams, setFetchParams] = useState({ offset: 0, limit: 1 })
  const [fetchedData, setFetchedData] = useState([])
  const [fetchStatus, setFetchStatus] = useState({})
  const [displayResults, setDisplayResults] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOptions, setSelectedOptions] = useState([])

  // create the query action with the promise used by useQuery. Needed to get access to the fetchParams
  const fetchAction = ({ queryKey }) => {
    const [_key, fetchParams] = queryKey
    return fetchContainers(fetchParams)
  }

  // Query to used to fetch more options
  const { data } = useQuery(["fetchOptions", fetchParams], fetchAction, {
    // The query will not execute until it is triggered by the isFetching boolean
    enabled: !!isFetching,
    // do not refetch on focus since it would add existing items to the fetched options array
    refetchOnWindowFocus: false,
    // use the callback to add the fetched options
    onSuccess: (data) => {
      if (data?.total) {
        setFetchStatus({ ...fetchStatus, total: data.total })
      }
      if (data?.containers && data?.containers?.length > 0) {
        setFetchedData([...fetchedData, ...data.containers])
      } else {
        // if no more options stop fetching
        setIsFetching(false)
      }
    },
  })

  // recalculate the offset when we get new fetched options
  useEffect(() => {
    if (fetchedData.length > 0) {
      const offset = fetchedData.length
      if (offset < fetchStatus.total) {
        setFetchParams({ ...fetchParams, offset: offset, limit: FETCH_LIMIT })
        setFetchStatus({
          ...fetchStatus,
          message: `${offset} / ${fetchStatus.total}`,
        })
      } else {
        setIsFetching(false)
      }
    }
  }, [fetchedData])

  // compute difference between the fetched from api
  // and the selected so the same option can't be selected more then one time
  useEffect(() => {
    if (fetchedData) {
      // remove selected options
      const difference = fetchedData.filter(
        ({ container_ref: id1 }) =>
          !selectedOptions.some(({ container_ref: id2 }) => id2 === id1)
      )
      // filter the difference with the filter string given by the user
      const regex = new RegExp(regexString(searchTerm.trim()), "i")
      const filteredOptions = difference.filter(
        (i) => `${i?.name} ${i.container_ref}`?.search(regex) >= 0
      )
      setDisplayResults(filteredOptions)
    }
  }, [selectedOptions, fetchedData, searchTerm])

  useEffect(() => {
    if (!text || text?.length <= 3) {
      setIsFiltering(false)
      setIsFetching(false)
      setSearchTerm("")
      return
    }
    setSearchTerm(text)
    setIsFiltering(true)

    // start fetching
    if (!isFetching) {
      setIsFetching(true)
      setFetchParams({ ...fetchParams, offset: fetchedData.length, limit: 1 })
    }
  }, [text])

  const updateSelectedOptions = (options) => {
    setSelectedOptions(options)
  }
  const cancel = () => {
    setIsFetching(false)
  }

  return {
    displayResults,
    isFetching,
    isFiltering,
    fetchStatus,
    updateSelectedOptions,
    cancel,
  }
}

export default useContainersSearch
