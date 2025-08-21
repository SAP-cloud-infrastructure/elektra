import React from "react"
import PropTypes from "prop-types"

import VirtualizedTable from "lib/components/VirtualizedTable"
import ContextMenu from "lib/components/ContextMenuPopover"
import TimeAgo from "../shared/TimeAgo"
import { Unit } from "lib/unit"
import FileIcon from "./FileIcon"

const unit = new Unit("B")

const Table = ({
  data,
  changeDir,
  deleteFile,
  deleteFolder,
  downloadFile,
  showProperties,
  moveFile,
  copyFile,
  rawUrl,
}) => {
  const columns = React.useMemo(
    () => [
      {
        label: "Object name",
        accessor: "display_name",
        sortable: "text",
        // filterable: true,
      },
      {
        label: "Last modified",
        accessor: "last_modified",
        width: "20%",
        sortable: "date",
      },
      {
        label: "Size",
        accessor: "bytes",
        width: "20%",
        sortable: true,
      },
      {
        width: "60",
      },
    ],
    []
  )

  const Row = React.useCallback(
    ({ Row, item }) => (
      <Row>
        <Row.Column>
          {(item.isProcessing || item.isDeleting) && (
            <>
              <span className="spinner" />{" "}
              {item.progress && `${parseFloat((item.progress / data.length) * 100).toFixed(2)}%`}
            </>
          )}
          <FileIcon item={item} />

          {/(^text\/.*|^video\/.*|^image\/.*|application\/(json|javascript|pdf))$/.test(item.content_type) ? (
            <a href={rawUrl(item)} target="_blank" rel="noreferrer">
              {item.display_name}
            </a>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (item.subdir) changeDir(item)
                else downloadFile(item)
              }}
            >
              {item.display_name}
            </a>
          )}
          {item.error && (
            <>
              <br />
              <span className="text-danger">{item.error}</span>
            </>
          )}
        </Row.Column>
        <Row.Column>{!item.subdir && <TimeAgo date={item.last_modified} originDate />}</Row.Column>
        <Row.Column>{!item.subdir && unit.format(item.bytes)}</Row.Column>
        <Row.Column>
          {item.subdir ? (
            <ContextMenu>
              <ContextMenu.Item onClick={() => deleteFolder(item)} disabled={item.isDeleting}>
                Delete recursively
              </ContextMenu.Item>
            </ContextMenu>
          ) : (
            <ContextMenu>
              <ContextMenu.Item onClick={() => downloadFile(item, { keepSegments: false })}>Download</ContextMenu.Item>

              <ContextMenu.Divider />
              <ContextMenu.Item onClick={() => showProperties(item)}>Properties</ContextMenu.Item>
              <ContextMenu.Item divider />

              <ContextMenu.Item onClick={() => copyFile(item)}>Copy</ContextMenu.Item>
              <ContextMenu.Item onClick={() => moveFile(item)}>Move/Rename</ContextMenu.Item>
              <ContextMenu.Item onClick={() => deleteFile(item)}>Delete</ContextMenu.Item>
              <ContextMenu.Item onClick={() => deleteFile(item, { keepSegments: true })}>
                Delete (keep segments)
              </ContextMenu.Item>
            </ContextMenu>
          )}
        </Row.Column>
      </Row>
    ),
    [data.length]
  )

  return (
    <VirtualizedTable
      height="max"
      rowHeight={50}
      columns={columns}
      data={data || []}
      renderRow={Row}
      showHeader
      bottomOffset={160} // footer height
    />
  )
}

Table.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  changeDir: PropTypes.func.isRequired,
  downloadFile: PropTypes.func.isRequired,
  deleteFile: PropTypes.func.isRequired,
  deleteFolder: PropTypes.func.isRequired,
  copyFile: PropTypes.func.isRequired,
  moveFile: PropTypes.func.isRequired,
  showProperties: PropTypes.func.isRequired,
  rawUrl: PropTypes.func.isRequired,
}

export default Table
