import React from "react"

export function moveItems(items, { index: idx, step: step }) {
  const movedItems = [...items]
  const p1 = movedItems[idx],
    p2 = movedItems[idx + step]
  if (p1 !== null && p2 !== null) {
    movedItems[idx] = p2
    movedItems[idx + step] = p1
  }
  return movedItems
}

export const MoveOperation = ({ index, itemCount, onMove }) => {
  const moveUpEnabled = index > 0
  const moveDownEnabled = index < itemCount - 1

  return (
    <div>
      <button
        className="btn btn-xs btn-default"
        onClick={() => moveUpEnabled && onMove({ index: index, step: -1 })}
        disabled={!moveUpEnabled}
      >
        Move up
      </button>
      <button
        className="btn btn-xs btn-default"
        onClick={() => moveDownEnabled && onMove({ index: index, step: +1 })}
        disabled={!moveDownEnabled}
      >
        Move down
      </button>
    </div>
  )
}
