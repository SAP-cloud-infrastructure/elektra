import React from "react"
//A <table> with pagination, filtering and sorting. Give the individual table rows as
//children, and specify column attributes in props.columns like this:
//
//    //NOTE: Place this on the package level, not in render(), so that the
//    //same array gets reused across render() calls.
//    const columns = [
//      { key: 'id', label: 'Volume ID' },
//      { key: 'size', label: 'Volume Size',
//        sortStrategy: 'numeric', sortKey: props => props.volume.size || 0 },
//      { key: 'status', label: 'Status',
//        sortStrategy: 'text', sortKey: props => props.volume.status || '',
//        searchKey: props => props.volume.status || '' },
//    ];
//
//    render() {
//      ...
//      return (
//        <DataTable columns={columns} ...>
//          {entries.map(entry => <MyRowComponent key={entry.id} data={entry} ... />)}
//        </DataTable>
//      ;
//    }
//
//To enable pagination, give the maximum number of rows as props.pageSize.
//
//Columns can be declared as sortable by setting `sortStrategy` to either
//`numeric` or `text`. In either case, `sortKey` must be a function that
//extracts the sorting key for a given row from its props. For the `numeric`
//sorting strategy, this must return a number. For the `text` sorting strategy,
//this must return a string.
//
//Columns can be declared as searchable by supplying a `searchKey` function.
//The table does not render a textbox on its own; you need to supply the
//`searchText` attribute on the <DataTable/> to trigger filtering.
//
//Each child element should render exactly one <tr> each with the same
//column layout as defined in props.columns of the DataTable.

const sorters = {
  text: (a, b) => a[1].localeCompare(b[1]),
  numeric: (a, b) => a[1] - b[1],
}

//TODO: replace <Pagination/> in ./pagination.js with this (while retaining the
//original API of <Pagination/> -- this one is much nicer)
const DataTablePaginationControls = ({ curr, count, set }) => {
  const btns = []
  const spread = 3 // how many absolute pages are shown around the current one

  if (curr == 1) {
    btns.push(
      <li key="first" className="first disabled">
        <a onClick={(e) => false}>« First</a>
      </li>
    )
    btns.push(
      <li key="prev" className="prev disabled">
        <a onClick={(e) => false}>‹ Prev</a>
      </li>
    )
  } else {
    btns.push(
      <li key="first" className="first">
        <a onClick={(e) => set(1)}>« First</a>
      </li>
    )
    btns.push(
      <li key="prev" className="prev">
        <a onClick={(e) => set(curr - 1)}>‹ Prev</a>
      </li>
    )
  }

  if (curr > spread + 1) {
    btns.push(
      <li key="gap-left" className="page gap disabled">
        <a onClick={(e) => false}>…</a>
      </li>
    )
  }

  for (let idx = curr - spread; idx <= curr + spread; idx++) {
    if (idx < 1 || idx > count) {
      continue
    }
    const idx2 = idx // duplicate variable for use in lambda
    btns.push(
      <li key={`page${idx}`} className={idx == curr ? "page active" : "page"}>
        <a onClick={(e) => set(idx2)}>{idx}</a>
      </li>
    )
  }

  if (curr < count - spread) {
    btns.push(
      <li key="gap-right" className="page gap disabled">
        <a onClick={() => false}>…</a>
      </li>
    )
  }

  if (curr == count) {
    btns.push(
      <li key="next" className="next_page disabled">
        <a onClick={(e) => false}>Next ›</a>
      </li>
    )
    btns.push(
      <li key="last" className="last next disabled">
        <a onClick={(e) => false}>Last »</a>
      </li>
    )
  } else {
    btns.push(
      <li key="next" className="next_page">
        <a onClick={(e) => set(curr + 1)}>Next ›</a>
      </li>
    )
    btns.push(
      <li key="last" className="last next">
        <a onClick={(e) => set(count)}>Last »</a>
      </li>
    )
  }

  return <ul className="pagination">{btns}</ul>
}

export class DataTable extends React.Component {
  state = {
    sortColumnIdx: null, //index into this.props.columns
    sortDirection: null, //'asc' or 'desc'
    currentPage: 1, //numbering starts at 1
  }

  componentDidUpdate(prevProps) {
    if (prevProps.searchText !== this.props.searchText) {
      //page number may change when the search text changes -> go back to page 1 to ensure we're on a valid page
      this.setState({ ...this.state, currentPage: 1 })
    }
  }

  setSortColumnIdx(columnIdx) {
    if (this.state.sortColumnIdx == columnIdx) {
      //when already sorted on this column, just flip direction
      this.setState({
        ...this.state,
        sortDirection: this.state.sortDirection == "asc" ? "desc" : "asc",
        currentPage: 1, //go back to the first page
      })
    } else {
      this.setState({
        ...this.state,
        sortColumnIdx: columnIdx,
        sortDirection: "asc",
        currentPage: 1, //go back to the first page
      })
    }
  }

  pageCount() {
    const pageSize = this.props.pageSize
    if (pageSize > 0) {
      const rows = this.getVisibleRows()
      return Math.ceil(rows.length / pageSize)
    }
    return 1 //when pagination is disabled, there is only one page
  }

  setCurrentPage(page) {
    page = Math.max(page, 1)
    page = Math.min(page, this.pageCount())

    if (this.state.currentPage != page) {
      this.setState({
        ...this.state,
        currentPage: page,
      })
    }
  }

  renderColumnHeader(column, columnIdx, isEmpty) {
    //never show sorting controls when the table is empty, otherwise the
    //appearing and disappearing sorting controls mess up the layouting
    if (isEmpty) {
      return <th key={column.key}>{column.label}</th>
    }

    const isSorted = this.state.sortColumnIdx == columnIdx
    const isSortable = column.sortStrategy != null

    const extraProps = {}
    if (isSortable) {
      extraProps.className = "sortable"
      extraProps.onClick = (e) => {
        e.stopPropagation()
        this.setSortColumnIdx(columnIdx)
      }

      extraProps.title =
        isSorted && this.state.sortDirection == "asc"
          ? "Click to sort in descending order"
          : "Click to sort in ascending order"
    }

    const sortIconType = column.sortStrategy == "text" ? "alpha" : "amount"
    return (
      <th key={column.key} {...extraProps}>
        {column.label}
        {isSortable && " "}
        {isSorted && <i className={`fa fa-sort-${sortIconType}-${this.state.sortDirection}`} />}
        {!isSorted && isSortable && <i className={`fa fa-sort-${sortIconType}-asc sortable-hint`} />}
      </th>
    )
  }

  getVisibleRows() {
    const rows = this.props.children
    const searchText = this.props.searchText
    if (!searchText) {
      return rows
    }

    let pattern
    try {
      pattern = new RegExp(searchText, "i")
    } catch (e) {
      return rows
    }

    return rows.filter((row) =>
      this.props.columns.some(
        (column) => column.searchKey && pattern.test((column.searchKey(row.props) || "").toString())
      )
    )
  }

  render() {
    let rows = this.getVisibleRows()

    //if requested, sort rows using a classic Schwartzian transform
    if (this.state.sortColumnIdx != null) {
      const column = this.props.columns[this.state.sortColumnIdx]
      const sorter = sorters[column.sortStrategy]

      rows = rows
        .map((row) => [row, column.sortKey(row.props)])
        .sort(sorter)
        .map((pair) => pair[0])
      if (this.state.sortDirection == "desc") {
        rows.reverse()
      }
    }

    //show pagination controls only if there is more than one page
    const pageCount = this.pageCount()
    const isPaginated = pageCount > 1
    if (isPaginated) {
      const size = this.props.pageSize
      const curr = this.state.currentPage
      rows = rows.slice((curr - 1) * size, curr * size)
    }

    const isEmpty = rows.length == 0
    if (isEmpty) {
      rows = [
        <tr key="no-entries">
          <td colSpan={this.props.columns.length} className="text-muted text-center">
            No entries
          </td>
        </tr>,
      ]
    }

    return (
      <>
        <table className={`table elektraDataTable ${this.props.className || ""}`}>
          <thead>
            <tr>{this.props.columns.map((column, idx) => this.renderColumnHeader(column, idx, isEmpty))}</tr>
          </thead>
          <tbody>
            {rows}
            {isPaginated && (
              <tr>
                <td colSpan={this.props.columns.length}>
                  <DataTablePaginationControls
                    curr={this.state.currentPage}
                    count={pageCount}
                    set={(page) => this.setCurrentPage(page)}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    )
  }
}
