/* eslint-disable react/no-unescaped-entities */
import { Link } from "react-router-dom"
import { SearchField } from "lib/components/search_field"
import SearchItem from "./search_item"
// import { AjaxPaginate } from 'lib/components/ajax_paginate';
import { Pagination } from "lib/components/pagination"
import { scope } from "lib/ajax_helper"
import React from "react"

export default class Search extends React.Component {
  componentDidMount() {
    this.currentScope = scope.domain ? scope.domain : ""
    if (scope.project && scope.project != "cc-tools") {
      this.currentScope = this.currentScope + "/" + scope.project
    }
    this.props.loadTypesOnce()
    this.props.loadAggregatesOnce()

    // try to find init search term and type in url
    const searchTermMatch = this.props.location.search.match(
      /[?|&]searchTerm=([^&]+)/
    )
    const searchTypeMatch =
      this.props.location.search.match(/[?|&]type=([^&]+)/)

    this.searchTerm = searchTermMatch && searchTermMatch[1]
    this.objectType = searchTypeMatch && searchTypeMatch[1]
    if (this.searchTerm || this.objectType)
      this.props.search({ term: this.searchTerm, objectType: this.objectType })
  }

  highlightSearchTerm = (string) => {
    if (!string) return
    const searchTerm = this.props.objects.searchTerm
    const searchType = this.props.objects.searchType

    if (!searchTerm || searchTerm.length == 0) return string

    const index = string.indexOf(searchTerm)

    if (index < 0) return string
    const length = searchTerm.length

    return (
      <>
        {string.substring(0, index)}
        <span className="highlight">
          {string.substring(index, index + length)}
        </span>
        {string.substring(index + string.length)}
      </>
    )
  }

  render() {
    const vcAggregates =
      this.props.aggregates && this.props.aggregates.items
        ? this.props.aggregates.items.filter((a) => a.name.indexOf("vc-") === 0)
        : []

    const availableTypes = this.props.types.items.sort()
    return (
      <div className="tools">
        <div className="toolbar">
          {this.props.types.isFetching ? (
            <span>
              <i className="spinner"></i>
              Loading Types...
            </span>
          ) : (
            <select
              className="form-select w-auto"
              onChange={(e) =>
                this.props.search({ objectType: e.target.value })
              }
              value={this.props.objects.searchType}
            >
              <option value="">All</option>
              {availableTypes.map((type, index) => (
                <option value={type} key={index}>
                  {type}
                </option>
              ))}
            </select>
          )}
          <span className="toolbar-input-divider"></span>
          <SearchField
            isFetching={this.props.objects.isFetching}
            onChange={(term) => this.props.search({ term })}
            value={this.props.objects.searchTerm}
            placeholder="Object ID, name or description"
            text="Searches by ID, name or description."
          />
          {this.props.objects.total > 0 && (
            <>
              <span className="toolbar-input-divider"></span>
              total: {this.props.objects.total}
            </>
          )}
          {this.props.objects.total > 0 && !this.props.objects.isFetching && (
            <div className="main-buttons">
              <a
                className="btn btn-primary btn-sm"
                href={`/${this.currentScope}/cache/csv?term=${
                  this.props.searchTerm || ""
                }&type=${this.props.searchType || ""}`}
                target="_blank"
                rel="noreferrer"
              >
                Export AS CSV
              </a>
            </div>
          )}
        </div>

        {this.props.objects.items && this.props.objects.items.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th className="search-result-type">Type</th>
                <th className="search-result-name">Name/ID</th>
                <th className="search-result-details">Details</th>
                <th className="search-result-domain">Domain</th>
                <th className="search-result-project">(Parent) Project</th>
                <th className="snug"></th>
              </tr>
            </thead>
            <tbody>
              {this.props.objects.items.map((item, index) => (
                <SearchItem
                  term={this.props.objects.searchTerm}
                  item={item}
                  aggregates={vcAggregates}
                  key={index}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <>
            {this.props.objects.receivedAt && (
              <div className="search-result-empty">Nothing found</div>
            )}
          </>
        )}

        <div className="u-flex-container pagination-container">
          {this.props.objects.receivedAt && (
            // show this only after we have searched at least once (don't want this to be visible on initial load)
            <>
              <div className="alert alert-info">
                Please note that this search operates on cached data. It might
                not be 100% in sync with live data.
              </div>
              <Link
                to="/universal-search/live"
                className="search-result-livesearch-link"
              >
                <i className="fa fa-fw fa-arrow-circle-right"></i>
                Couldn't find what you were looking for? Try a live search
              </Link>
            </>
          )}
          <Pagination
            currentPage={this.props.objects.currentPage}
            total={this.props.objects.total}
            perPage={100}
            onChange={this.props.loadPage}
            className="pagination-container u-flex-pos-right"
          />
        </div>
      </div>
    )
  }
}
