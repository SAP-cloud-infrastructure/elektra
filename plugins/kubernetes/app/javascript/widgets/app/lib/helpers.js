/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ReactHelpers = {}
import React from "react"

ReactHelpers.mergeObjects = function (obj1, obj2, obj3) {
  if (obj3 == null) {
    obj3 = {}
  }
  const result = {}
  for (var key in obj1) {
    result[key] = obj1[key]
  }
  for (var key in obj2) {
    result[key] = obj2[key]
  }
  for (var key in obj3) {
    result[key] = obj3[key]
  }
  return result
}

ReactHelpers.cloneHashMap = (obj) => JSON.parse(JSON.stringify(obj))

ReactHelpers.findIndexInArray = function (items, itemId, itemIdKey) {
  if (itemIdKey == null) {
    itemIdKey = "id"
  }
  let index = -1
  for (let i = 0; i < items.length; i++) {
    var item = items[i]
    if (item[itemIdKey] === itemId) {
      index = i
      break
    }
  }
  return index
}

ReactHelpers.findInArray = function (items, itemId) {
  let item = null
  for (var i of Array.from(items)) {
    if (i.id === itemId) {
      item = i
      break
    }
  }
  return item
}

// check if two arrays are equal
ReactHelpers.arrayEqual = (a, b) =>
  a.length === b.length && a.every((elem, i) => elem === b[i])

// Returns an array with only unique values (doesn't work for arrays of objects)
ReactHelpers.arrayOnlyUnique = (arr) =>
  arr.filter((value, index, self) => self.indexOf(value) === index)

// Updates attributes of items in an item list in state. Updates are passed as a hash map (attribute-key: attribute-value)
ReactHelpers.updateItemInList = function (state, itemId, itemIdKey, updates) {
  if (updates == null) {
    updates = {}
  }
  const index = ReactHelpers.findIndexInArray(state.items, itemId, itemIdKey)
  if (index < 0) {
    return state
  }

  const newState = ReactHelpers.cloneHashMap(state)
  for (var key in updates) {
    var value = updates[key]
    newState.items[index][key] = value
  }

  return newState
}

// Get value of given attribute from item in list
ReactHelpers.getItemAttribute = function (
  items,
  itemId,
  itemIdKey,
  attributeKey
) {
  const index = ReactHelpers.findIndexInArray(items, itemId, itemIdKey)
  if (index < 0) {
    return ""
  }

  return items[index][attributeKey]
}

// Check if given value exists (not undefined, not null) and has length 0
ReactHelpers.isEmpty = function (s) {
  if (s != null && s.length === 0) {
    return true
  }
}

export default ReactHelpers
