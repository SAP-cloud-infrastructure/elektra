import React from "react"

export function moveItems(items, idx, step) {
  const movedItems = [...items]
  console.log(step)
  const p1 = movedItems[idx],
    p2 = movedItems[idx + step]
  if (p1 !== null && p2 !== null) {
    movedItems[idx] = p2
    movedItems[idx + step] = p1
  }
  return movedItems
}

export const MoveOperation = ({ index, itemCount, onMove }) => {
  return (
    <div>
      <button className="btn btn-xs btn-default" onClick={() => onMove(index, -1)} disabled={index == 0}>
        Move up
      </button>
      <button className="btn btn-xs btn-default" onClick={() => onMove(index, +1)} disabled={index >= itemCount - 1}>
        Move down
      </button>
    </div>
  )
}
