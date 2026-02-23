/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// D3 v3 is loaded globally from vendor/assets/javascripts/d3.v3.min.js
// Access it from window object to avoid bundling issues with 'this' context
const d3 = window.d3

var Topology = (function () {
  let defaults = undefined
  let flatten = undefined
  Topology = class Topology {
    static initClass() {
      defaults = {
        nominalBaseNodeSize: 18,
        nominalTextSize: 12,
        maxTextSize: 24,
        nominalStroke: 1.5,
        maxStroke: 4.5,
        maxBaseNodeSize: 36,
        minZoom: 0.1,
        maxZoom: 7,
      }

      flatten = function (root) {
        const nodes = []
        let i = 0

        var recurse = function (node) {
          if (node.children) {
            node.children.forEach(recurse)
          }
          if (!node.id) {
            node.id = ++i
          }
          return nodes.push(node)
        }

        recurse(root)
        return nodes
      }
    }

    // container is a DOM element, data is a json
    constructor(container, data, options) {
      // console.log(options)
      if (options == null) {
        options = {}
      }
      this.containerSelector = container
      this.options = $.extend(defaults, options)
      // create popover template with left arrow and add it to container
      const popoverHolder = $('<div class="networking"></div>').appendTo("body")
      const $popover =
        $(`<div class="topology popover fade right in" role="tooltip"> \
<div class="arrow" style="top: 20px"></div> \
<h3 class="popover-title">Details</h3> \
<div class="popover-content"></div></div>`).appendTo(popoverHolder)

      this.width = Math.max($(container).innerWidth(), 900)
      this.height = Math.max($(container).innerHeight(), 500)

      this.focusNode = null
      this.heightighlightNode = null

      // create svg element
      this.canvas = d3
        .select(container)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .style("cursor", "move")
      // zoom feature
      const zoom = d3.behavior
        .zoom()
        .scaleExtent([this.options.minZoom, this.options.maxZoom])
      // create graph container
      this.graph = this.canvas.append("g").attr("class", "topology")

      // convert data to nodes and links
      const nodes = flatten(data)
      const links = d3.layout.tree().links(nodes)

      this.linksedByIndex = {}
      links.forEach((d) => {
        return (this.linksedByIndex[d.source + "," + d.target] = true)
      })

      // create force layout
      this.layout = d3.layout
        .force()
        .linkDistance(80)
        .charge(-400)
        .size([this.width, this.height])
        .nodes(nodes)
        .links(links)
        .start()

      // add links to graph
      this.links = this.graph
        .selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .style("stroke-width", this.options.nominalStroke)

      // add nodes to graph
      this.nodes = this.graph
        .selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", (d, i) => `node ${d.type}`)
        .call(this.layout.drag)

      // add circles to nodes
      this.circle = this.nodes
        .append("circle")
        .attr("r", this.options.nominalBaseNodeSize)
        .style("fill", "white")

      // add icons to nodes
      this.icons = this.nodes
        .append("text")
        .attr("class", "icon")
        .style("font-family", "FontAwesome")
        .style("font-size", this.options.nominalBaseNodeSize)
        .attr("dx", -this.options.nominalBaseNodeSize / 2 + 1)
        .attr("dy", this.options.nominalBaseNodeSize / 2 - 2)
        .text(function (d) {
          switch (d.type) {
            case "network":
              return "\uf0c2"
            case "server":
              return "\uf0a0"
            case "router":
              return "\uf0e8"
            case "gateway":
              return "\uf0ac"
          }
        })

      // add labels to nodes
      this.labels = this.nodes
        .append("text")
        .attr("class", "label")
        .text((node) => node.name)
        .style("font-size", this.options.nominalTextSize)
        .style("font-weight", "normal")
        .attr("dx", this.options.nominalBaseNodeSize + 2)

      this.dragFlag = false
      // define callbacks for mouse events
      this.nodes
        .on("mousemove", (d) => {
          return (this.dragFlag = true)
        })
        .on("mouseover", (d) => this.setHighlight(d))
        .on("mousedown", (d) => {
          this.dragFlag = false
          d3.event.stopPropagation()
          this.focusNode = d
          this.setFocus(d)
          if (this.heightighlightNode === null) {
            return this.setHighlight(d)
          }
        })
        .on("mouseout", (d) => this.exitHighlight())
        .on("mouseup", (d, i) => {
          if (!this.dragFlag) {
            // show popover
            if (
              $popover.is(":visible") &&
              $popover.data("currentNode") === d.id
            ) {
              $popover.hide()
              return false
            }

            const $graph = $($(container + " g.topology")[0])
            const $element = $($(container + " g.node")[i])

            let scale = 1
            if ($graph.length > 0 && $graph.attr("scale")) {
              scale = parseFloat($graph.attr("scale"))
            }

            $popover.css({
              top:
                $element.offset().top -
                this.options.nominalBaseNodeSize +
                this.options.nominalBaseNodeSize * scale,
              left:
                $element.offset().left +
                this.options.nominalBaseNodeSize * 2 * scale,
            })

            let title = d.type + (d.name ? ` (${d.name})` : "")
            title = title[0].toUpperCase() + title.slice(1)

            $popover.find(".popover-title").text(title)
            $popover
              .find(".popover-content")
              .html('<span class="spinner"></span>')
            $popover.show("fast")
            return this.getNodeDetails(d.type, d.id, function (html, status) {
              if (status === 404) {
                $element.attr("class", $element.attr("class") + " not-found")
                html = `This ${d.type} does not exist anymore or you don't have permissions to access it.`
              }

              $popover.find(".popover-content").html(html)
              return $popover.data("currentNode", d.id)
            })
          }
        })

      d3.select(window).on("mouseup", () => {
        if (this.focusNode !== null) {
          this.focusNode = null
          this.graph.selectAll(".node text").style("opacity", 1)

          this.circle.style("opacity", 1)
          this.labels.style("opacity", 1)
          this.links.style("opacity", 1)
        }

        if (this.heightighlightNode === null) {
          this.exitHighlight()
          return $popover.hide()
        }
      })

      // define zoom behavior
      zoom.on("zoom", () => {
        let stroke = this.options.nominalStroke
        if (
          this.options.nominalStroke * zoom.scale() >
          this.options.maxStroke
        ) {
          stroke = this.options.maxStroke / zoom.scale()
        }
        this.links.style("stroke-width", stroke)
        this.circle.style("stroke-width", stroke)

        let baseRadius = this.options.nominalBaseNodeSize
        if (
          this.options.nominalBaseNodeSize * zoom.scale() >
          this.options.maxBaseNodeSize
        ) {
          baseRadius = this.options.maxBaseNodeSize / zoom.scale()
        }

        let textSize = this.options.nominalTextSize
        if (
          this.options.nominalTextSize * zoom.scale() >
          this.options.maxTextSize
        ) {
          textSize = this.options.maxTextSize / zoom.scale()
        }
        this.labels.style("font-size", textSize + "px")

        return this.graph
          .attr(
            "transform",
            `translate(${d3.event.translate})scale(${d3.event.scale})`
          )
          .attr("dx", d3.event.translate[0])
          .attr("dy", d3.event.translate[1])
          .attr("scale", zoom.scale())
      })

      this.canvas.call(zoom)

      d3.select(window).on("resize", this.resize)

      this.layout.on("tick", () => {
        this.nodes.attr("transform", (d) => `translate(${d.x},${d.y})`)
        this.links
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y)

        return this.nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y)
      })
    }

    getNodeDetails(type, id, callback) {
      if (!this.nodeDetails) {
        this.nodeDetails = {}
      }
      const key = `${type}_${id}`
      if (this.nodeDetails[key]) {
        return callback(
          this.nodeDetails[key].content,
          this.nodeDetails[key].status
        )
      }

      return $.get(`${this.options.details_url}`, {
        type: `${type}`,
        id: `${id}`,
      })
        .error((jqXHR, textStatus, errorThrown) => {
          this.nodeDetails[key] = { status: jqXHR.status, content: "" }
          return callback("Loading error.", jqXHR.status)
        })
        .done((data, status, xhr) => {
          const url = xhr.getResponseHeader("Location")
          // got a redirect response
          if (url) {
            // close modal window
            $("#modal-holder").find(".modal").modal("hide")
            return (window.location = url)
          } else {
            this.nodeDetails[key] = { status: 200, content: data }
            return callback(data, 200)
          }
        })
    }

    isConnected(a, b) {
      return (
        this.linksedByIndex[a.index + "," + b.index] ||
        this.linksedByIndex[b.index + "," + a.index] ||
        a.index === b.index
      )
    }

    hasConnections(a) {
      for (var property in this.linksedByIndex) {
        var index = this.linksedByIndex[property]
        var s = property.split(",")
        if (
          (s[0] === a.index || s[1] === a.index) &&
          this.linksedByIndex[property]
        ) {
          return true
        }
      }

      return false
    }

    exitHighlight() {
      this.heightighlightNode = null
      if (this.focusNode === null) {
        this.canvas.style("cursor", "move")
        return this.labels.style("font-weight", "normal")
      }
    }

    setFocus(d) {
      this.graph
        .selectAll(".node .icon")
        .style("opacity", (o) => (this.isConnected(d, o) ? 1 : 0.4))
      this.labels.style("opacity", (o) => (this.isConnected(d, o) ? 1 : 0.4))
      this.links.style(
        "opacity",
        (o) =>
          o.source.index === d.index || o.target.index === (d.index ? 1 : 0.4)
      )
      return this.icons.style("opacity", (o) =>
        this.isConnected(d, o) ? 1 : 0.4
      )
    }

    setHighlight(d) {
      this.canvas.style("cursor", "pointer")
      if (this.focusNode !== null) {
        d = this.focusNode
      }
      this.heightighlightNode = d

      return this.labels.style("font-weight", (o) =>
        this.isConnected(d, o) ? "bold" : "normal"
      )
    }

    resize() {
      const newWidth = Math.max($(this.containerSelector).innerWidth(), 900)
      const newHeight = Math.max($(this.containerSelector).innerHeight(), 500)

      this.canvas.attr("width", newWidth).attr("height", newHeight)

      this.layout
        .size([
          force.size()[0] + (newWidth - this.width) / zoom.scale(),
          force.size()[1] + (newHeight - this.height) / zoom.scale(),
        ])
        .resume()
      this.width = newWidth
      return (this.height = newHeight)
    }
  }
  Topology.initClass()
  return Topology
})()

if (!window.networking) {
  window.networking = {}
}
if (!window.networking.Topology) {
  window.networking.Topology = Topology
}
