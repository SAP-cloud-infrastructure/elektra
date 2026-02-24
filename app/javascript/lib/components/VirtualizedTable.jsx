import React from "react"
import PropTypes from "prop-types"
import { FixedSizeList as List } from "react-window"
import scrollbarWidth from "../scrollbarWidth"

/**
 * Example:
 *  <VirtualizedTable
 *    height={400}
 *    width={1140}
 *    rowHeight={50}
 *    columns={columns}
 *    data={containers.items || []}
 *    renderRow={({Row, item}) => {
 *      <Row>
 *        <Row.Column>Column 1</Row.Column>
 *        <Row.Column>Column 2</Row.Column>
 *        <Row.Column>Column 3</Row.Column>
 *        <Row.Column>Column 4</Row.Column>
 *      </Row> 
 *    }}
 *    renderHeader={({ Header, sort, updateSort, filter, updateFilter }) => 
 *      <Header>
 *        <Header.Column>Header 1</Header.Column>
 *        <Header.Column>Header 2</Header.Column>
 *        <Header.Column>Header 3</Header.Column>
 *        <Header.Column>Header 4</Header.Column>
 *      </Header>
      }} 
 *    showHeader
 *  />
 */
/**
 * Calculate column widths based on total width and columns config
 * @param {object} properties width and columns
 * @returns an array of widths
 */
const calculateColumWidth = ({ width, columns }) => {
  // count invalid width values
  let count = 0
  // unused width
  let restWidth = width
  // valid types
  const validTypes = ["number", "string"]
  // for all columns
  let widths = columns.map((column) => {
    const type = typeof column.width
    // return null unless type of width is valid
    if (validTypes.indexOf(type) < 0) {
      count += 1
      return null
    }

    // parse value to get number
    let value = parseInt(column.width)
    if (type === "string" && column.width.slice(-1) === "%") {
      // precentage to value
      value = parseInt((value * width) / 100)
    }

    restWidth -= value
    if (restWidth < 0) restWidth = 0
    return value
  })

  // calculate missing widths and return
  return widths.map((value) => value || restWidth / count)
}

// Button to handle sort clicks
const SortIcon = ({ className, strategy, direction }) => {
  const sortIconType = React.useMemo(
    () => (strategy == "text" ? "alpha" : "amount"),
    [strategy]
  )

  const sortDirection = React.useMemo(() => {
    if (strategy === "date") return direction === "asc" ? "desc" : "asc"
    return direction || "asc"
  }, [strategy, direction])

  return (
    <span className={className}>
      <i
        className={`fa fa-sort-${sortIconType}-${sortDirection} ${
          !direction && "virtualized-table-sortable-icon-disabled"
        }`}
      />
    </span>
  )
}

SortIcon.propTypes = {
  className: PropTypes.string.isRequired,
  strategy: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  direction: PropTypes.string,
}

// Input to handle filtering per column
const FilterInput = ({ className, name, maxWidth, onChange, initialValue }) => {
  return (
    <input
      className={`${className} form-control input-sm`}
      style={{ maxWidth: maxWidth || 200 }}
      defaultValue={initialValue}
      type="text"
      placeholder={name ? `filter by ${name}` : "filter"}
      onChange={(e) => {
        onChange(e.target.value)
      }}
    />
  )
}

FilterInput.propTypes = {
  className: PropTypes.string.isRequired,
  name: PropTypes.string,
  maxWidth: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  initialValue: PropTypes.string,
}

// header component
const Header = ({
  width,
  columns,
  classNamePrefix,
  renderHeader,
  onFilterChange,
  onSortChange,
  itemsCount,
}) => {
  const [sort, updateSort] = React.useState({ direction: "asc" })
  const [filter, updateFilter] = React.useState({})

  React.useEffect(() => onFilterChange(filter), [filter])
  React.useEffect(() => onSortChange(sort), [sort])

  const customHeaderContent = React.useMemo(() => {
    if (!renderHeader) return null
    const Header = ({ children }) => {
      return React.Children.map(
        children,
        (child, index) =>
          index < columns.length && (
            <div
              key={index}
              style={{ width: columns[index].width }}
              className={`${classNamePrefix}-th`}
            >
              {React.cloneElement(child, {
                style: { ...child.props.style, opacity: 0.5 },
              })}
            </div>
          )
      )
    }
    Header.Column = ({ children }) => children
    return renderHeader({
      Header,
      columns,
      filter,
      updateFilter,
      sort,
      updateSort,
    })
  }, [classNamePrefix, columns, filter, updateFilter, sort, updateSort])

  return (
    <div
      style={{ display: "flex", width: width - scrollbarWidth() }}
      className={`${classNamePrefix}-tr ${classNamePrefix}-tr-head`}
    >
      {/* render custom header or default header */}
      {customHeaderContent ||
        columns.map((column, index) => (
          <div
            key={index}
            className={`${classNamePrefix}-th`}
            style={{
              width: column.width,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
              }}
            >
              {/* Add Sort Button unless renderHeader is defined. renderHeader is used for custom header Component */}
              {column.sortable && column.accessor ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    // toggle if same column
                    // otherwise reset direction to asc
                    let newDirection =
                      sort.column === column.accessor &&
                      sort.direction === "asc"
                        ? "desc"
                        : "asc"

                    updateSort({
                      column: column.accessor,
                      direction: newDirection,
                    })
                  }}
                >
                  {column.label}{" "}
                  <SortIcon
                    className={`${classNamePrefix}-sort-icon`}
                    strategy={column.sortable}
                    direction={
                      sort.column === column.accessor ? sort.direction : null
                    }
                  />
                </a>
              ) : (
                column.label
              )}
            </div>
            {/* Add filter Input unless renderHeader is defined. renderHeader is used for custom header Component */}
            {column.filterable && column.accessor && itemsCount > 1 && (
              <FilterInput
                className={`${classNamePrefix}-filter`}
                name={column.label}
                onChange={(value) => {
                  updateFilter({ ...filter, [column.accessor]: value })
                }}
              />
            )}
          </div>
        ))}
    </div>
  )
}

Header.displayName = "Header"
Header.propTypes = {
  itemsCount: PropTypes.number,
  width: PropTypes.number.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object),
  classNamePrefix: PropTypes.string,
  renderHeader: PropTypes.func,
  onSortChange: PropTypes.func,
  onFilterChange: PropTypes.func,
}

/**
 * React Component to render large data table
 * @param {object} props
 * @returns
 */
const VirtualizedTable = ({
  width: initialWidth,
  height: initialHeight,
  minHeight,
  columns,
  data,
  rowHeight,
  renderHeader,
  showHeader,
  renderRow,
  className,
  bottomOffset,
}) => {
  className = className || "virtualized-table"

  const [width, setWidth] = React.useState(
    typeof initialWidth === "string" ? 0 : initialWidth
  )
  const [height, setHeight] = React.useState(
    typeof initialHeight === "string" ? 0 : initialHeight
  )

  const holderElement = React.createRef()

  React.useEffect(() => {
    const filterActive = columns.reduce(
      (active, column) => (active = active && column.filterable),
      true
    )
    const headerHeight = filterActive ? 62 : 31
    const maxHeight =
      window.visualViewport.height -
      holderElement.current.offsetTop -
      headerHeight -
      (bottomOffset || 0)

    // set width and height
    if (!initialWidth || initialWidth === "auto")
      setWidth(holderElement.current.offsetWidth)
    if (!initialHeight || initialHeight === "auto")
      setHeight(holderElement.current.offsetHeight)
    if (initialHeight === "max") {
      // Apply minHeight constraint to maxHeight
      const finalHeight = minHeight && maxHeight < minHeight ? minHeight : maxHeight
      setHeight(finalHeight)
    }
  }, [])

  const [sort, updateSort] = React.useState({ direction: "asc" })
  const [filter, updateFilter] = React.useState({})

  // extend columns
  columns = React.useMemo(() => {
    if (!width) return columns
    // calculate widths and extend columns
    const widths = calculateColumWidth({ width, columns })

    return columns.map((column, index) => {
      column.width = widths[index]
      return column
    })
  }, [columns, width])

  // this function returns callbacks to get column contents of a row
  // it is a closure
  const rowColumnContentCallbacks = React.useMemo(() => {
    let columnContents

    const columnCallbacks = {}
    for (let i = 0; i < columns.length; i++) {
      columnCallbacks[`column${i + 1}`] = (result) =>
        (columnContents[i] = result || "")
    }

    // return a function which resets on every call the contents array
    return () => {
      columnContents = Array(columns.length)
      return { columnCallbacks, columnContents }
    }
  }, [columns.length])

  const items = React.useMemo(() => {
    let newItems = data.slice()

    // FILTER
    let keys = Object.keys(filter)
    if (keys.length > 0) {
      newItems = newItems.filter((item) => {
        for (let key of keys) {
          if (`${item[key]}`.indexOf(filter[key]) < 0) return false
        }
        return true
      })
    }

    // SORT
    if (sort.column && sort.direction) {
      // call slice to get a copy of data array
      // otherwise the Row callback does not react on resorting
      newItems = newItems.sort((a, b) => {
        if (a[sort.column] > b[sort.column] && sort.direction === "asc")
          return 1
        if (a[sort.column] > b[sort.column] && sort.direction === "desc")
          return -1
        if (a[sort.column] < b[sort.column] && sort.direction === "asc")
          return -1
        if (a[sort.column] < b[sort.column] && sort.direction === "desc")
          return 1
        return 0
      })
    }

    return newItems
  }, [data, sort, filter])

  // row component
  const Row = React.useCallback(
    ({ index, style }) => {
      const item = items[index]

      let rowContent

      if (renderRow) {
        // This allows to call <Row><Row.Column>Column Content</Row.Column> inside renderRow function
        const Row = ({ children }) => {
          return React.Children.map(
            children,
            (child, index) =>
              index < columns.length && (
                <div
                  key={index}
                  style={{ width: columns[index].width }}
                  className={`${className}-td`}
                >
                  {React.cloneElement(child, {
                    style: { ...child.props.style, opacity: 0.5 },
                  })}
                </div>
              )
          )
        }
        Row.Column = ({ children }) => children

        rowContent = renderRow({ Row, item })
      } else {
        rowContent = columns.map((column, index) => (
          <div
            key={index}
            style={{ width: column.width }}
            className={`${className}-td`}
          >
            {item[column.accessor] || ""}
          </div>
        ))
      }

      return (
        <div
          style={{ ...style, display: "flex" }}
          className={`${className}-tr ${className}-tr-${
            index % 2 === 0 ? "even" : "odd"
          }`}
        >
          {rowContent}
        </div>
      )
    },
    [items, columns, rowColumnContentCallbacks, renderRow]
  )

  return (
    <div
      className={className}
      ref={holderElement}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      {width && height ? (
        <>
          {(showHeader || renderHeader) && (
            <Header
              itemsCount={items.length}
              width={width}
              columns={columns}
              classNamePrefix={className}
              renderHeader={renderHeader}
              onFilterChange={(filter) => updateFilter(filter)}
              onSortChange={(sort) => updateSort(sort)}
            />
          )}

          <List
            height={height}
            itemCount={items.length}
            itemSize={rowHeight}
            width={width}
          >
            {Row}
          </List>
        </>
      ) : (
        <span>
          <span className="spinner" />
          Initializing...
        </span>
      )}
    </div>
  )
}

VirtualizedTable.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      accessor: PropTypes.string,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sortable: PropTypes.oneOf([true, false, "amount", "text", "date"]),
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowHeight: PropTypes.number,
  renderHeader: PropTypes.func,
  renderRow: PropTypes.func,
  className: PropTypes.string,
  showHeader: PropTypes.bool,
  bottomOffset: PropTypes.number,
}

export default VirtualizedTable
