import { scaleLinear } from "d3-scale"
import { max } from "d3-array"
import { select, event, mouse } from "d3-selection"
import {
  forceSimulation,
  forceLink,
  forceCenter,
  forceManyBody,
  forceX,
  forceY,
} from "d3-force"
import { drag } from "d3-drag"
import { zoom } from "d3-zoom"
import React from "react"

export class Graph extends React.Component {
  static defaultProps = {
    width: 1138,
    height: 600,
    zoomScale: 1,
    nodeColor: "#00b3ff",
    linkColor: "#bbb",
    nominalBaseNodeSize: 18,
    nominalTextSize: 12,
    maxTextSize: 12,
    nominalStroke: 1.5,
    maxStroke: 4.5,
    maxBaseNodeSize: 36,
    minZoom: 0.1,
    maxZoom: 7,
  }

  svgRef = React.createRef()
  graphRef = React.createRef()
  tooltipRef = React.createRef()
  detailsRef = React.createRef()

  componentDidMount() {
    this.zoomScale = 1

    const svg = select(this.svgRef.current)
    // add zoom capabilities
    zoom().on("zoom", this.zoomActions)(svg)
    this.graph = select(this.graphRef.current)
    this.tooltip = select(this.tooltipRef.current)
    this.details = select(this.detailsRef.current)

    // we use svg groups to logically group the elements together
    this.linkGroup = this.graph.append("g").attr("class", "links")
    this.nodeGroup = this.graph.append("g").attr("class", "nodes")
    this.textGroup = this.graph.append("g").attr("class", "texts")

    this.simulation = this.createSimulation(this.props.width, this.props.height)
    this.simulation.on("tick", this.handleTick)
    this.nodes = []
    this.links = []
  }

  static nodeLabel(node) {
    switch (node.cached_object_type) {
      case "port":
        return node.payload.fixed_ips.map((ip) => ip.ip_address).join(", ")
      case "floatingip":
        return node.payload.floating_ip_address
      default:
        return node.name
    }
  }

  shouldComponentUpdate(nextProps) {
    if (!nextProps.nodes) return false

    const nodesToBeAdded = nextProps.nodes.filter(
      (newNode) => this.nodes.findIndex((node) => node.id == newNode.id) < 0
    )
    const nodesToBeRemoved = this.nodes.filter(
      (oldNode) =>
        nextProps.nodes.findIndex((newNode) => newNode.id == oldNode.id) < 0
    )

    const linksToBeAdded = nextProps.links.filter(
      (newLink) =>
        this.links.findIndex(
          (link) =>
            link.source.id == newLink.source && link.target.id == newLink.target
        ) < 0
    )

    const linksToBeRemoved = this.links.filter(
      (oldLink) =>
        nextProps.links.findIndex(
          (newLink) =>
            newLink.source == oldLink.source.id &&
            newLink.target == oldLink.target.id
        ) < 0
    )

    for (let n of nodesToBeRemoved) {
      let index = this.nodes.findIndex((i) => i.id == n.id)
      if (index >= 0) this.nodes.splice(index, 1)
    }
    for (let l of linksToBeRemoved) {
      let index = this.links.findIndex(
        (i) => i.source.id == l.source.id && i.target.id == l.target.id
      )
      if (index >= 0) this.links.splice(index, 1)
    }
    nodesToBeAdded.forEach((n) =>
      this.nodes.push({
        ...n,
        x: this.props.width / 2,
        y: this.props.height / 2,
      })
    )
    linksToBeAdded.forEach((l) => this.links.push(l))

    for (let node of this.nodes) {
      let n = nextProps.nodes.find((newNode) => node.id == newNode.id)
      node.isFetching = n.isFetching
      node.receivedAt = n.receivedAt
    }

    // this.nodes = nextProps.nodes
    // this.links = nextProps.links

    this.updateGraph()
    // return false
    return false
  }

  handleToggleEvent = (node) => {
    // console.log(node)
    if (node.receivedAt) {
      this.props.removeRelatedObjects(node.id)
    } else {
      this.props.loadRelatedObjects(node.id)
    }
  }

  showDetails = (node) => {
    this.props.showDetails(event, node)
    // console.log(this.details.style('display'))
    // this.details.transition()
    //   .duration(200)
    //   .style("opacity", .8)
    //   .style('display','inline')
    // // this.tooltip.html(
    // //   <ReactJson src={JSON.stringify(node)} collapsed={1}/>
    // // )
    // .style("left", (event.offsetX + 10 ) + "px")
    // .style("top", (event.offsetY) + "px")
    // ReactDOM.render(<ReactJson src={node.payload} collapsed={1}/>, this.details.node())
  }

  handleTick = () => {
    if (this.nodeElements)
      this.nodeElements.attr(
        "transform",
        (d) => "translate(" + d.x + "," + d.y + ")"
      )
    // if(this.textElements) this.textElements
    //   .attr('x', node => node.x)
    //   .attr('y', node => node.y)
    if (this.linkElements)
      this.linkElements
        .attr("x1", (link) => link.source.x)
        .attr("y1", (link) => link.source.y)
        .attr("x2", (link) => link.target.x)
        .attr("y2", (link) => link.target.y)
  }

  dragDrop = drag()
    .on("start", (node) => {
      node.fx = node.x
      node.fy = node.y
    })
    .on("drag", (node) => {
      this.simulation.alphaTarget(0.7).restart()
      node.fx = event.x
      node.fy = event.y
    })
    .on("end", (node) => {
      if (!event.active) {
        this.simulation.alphaTarget(0)
      }
      node.fx = null
      node.fy = null
    })

  //Zoom functions
  zoomActions = () => {
    this.zoomScale = event.transform.k
    //graph.attr("transform", d3.event.transform)
    var stroke = this.props.nominalStroke
    if (this.props.nominalStroke * this.zoomScale > this.props.maxStroke) {
      stroke = this.props.maxStroke / this.zoomScale
    }

    this.linkGroup.selectAll("line").style("stroke-width", stroke)
    this.nodeGroup.selectAll("circle").style("stroke-width", stroke)

    // var baseRadius = this.props.nominalBaseNodeSize
    // if (this.props.nominalBaseNodeSize * scale > this.props.maxBaseNodeSize) {
    //   baseRadius = this.props.maxBaseNodeSize / scale
    // }

    var textSize = this.zoomScale > 1 ? 5 + this.zoomScale * this.zoomScale : 0
    if (textSize > this.props.maxTextSize) {
      textSize = this.props.maxTextSize
    }
    this.textGroup.selectAll("text").style("font-size", textSize + "px")

    this.graph.attr("transform", event.transform)
  }

  createSimulation = (width, height) => {
    const linkForce = forceLink()
      .id((link) => link.id)
      .distance(80)
      // .distance( link => {
      //   const targetOutgoingLinks = this.links.filter(l =>
      //     l.source.id == link.target.id
      //   )
      //   let length = targetOutgoingLinks.length/this.links.length * 500 + 80
      //   return length
      // })
      .iterations(5)

    return forceSimulation()
      .force("link", linkForce)
      .force("center", forceCenter(width / 2, height / 2))
      .force("charge", forceManyBody().strength(-80))
  }

  updateGraph = () => {
    // links
    this.linkElements = this.linkGroup
      .selectAll("line")
      .data(this.links, (link) => link.target.id + link.source.id)

    this.linkElements.exit().remove()

    let linkEnter = this.linkElements
      .enter()
      .append("line")
      .attr("stroke-width", 1)
      .attr("stroke", this.props.linkColor)

    this.linkElements = linkEnter.merge(this.linkElements)

    // nodes
    this.nodeElements = this.nodeGroup
      .selectAll(".node")
      .data(this.nodes, (node) => node.id)

    this.nodeElements.exit().remove()

    const nodeEnter = this.nodeElements
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(this.dragDrop)
      .on("mouseover", (d) => {
        // nodeGroup.selectAll()
        this.nodeGroup
          .selectAll("circle")
          .filter((n) => n.id == d.id)
          .attr("fill", "#eee")
          .attr("stroke", this.props.nodeColor)
        this.linkGroup
          .selectAll("line")
          .filter((l) => l.source.id == d.id || l.target.id == d.id)
          .style("stroke", this.props.nodeColor)

        this.tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9)
          .style("display", "inline")
        this.tooltip
          .html(
            d.cached_object_type +
              "<br/>" +
              d.label +
              "<br/><small>" +
              d.id +
              "</small>"
          )
          .style("left", event.offsetX + 10 + "px")
          .style("top", event.offsetY + "px")
      })
      .on("mouseout", (d) => {
        this.nodeGroup
          .selectAll("circle")
          .filter((n) => n.id == d.id)
          .attr("fill", "white")
          .attr("stroke", this.props.linkColor)

        this.linkGroup
          .selectAll("line")
          .filter((l) => l.source.id == d.id || l.target.id == d.id)
          .style("stroke", this.props.linkColor)

        this.tooltip
          .transition()
          .duration(500)
          .style("opacity", 0)
          .style("display", "none")
      })

    nodeEnter
      .append("circle")
      .attr("r", (d) => this.props.nominalBaseNodeSize)
      .attr("fill", "white")
      .attr("stroke-width", 1)
      .attr("stroke", this.props.linkColor)

    nodeEnter
      .append("circle")
      .attr("r", 5)
      .attr("cx", -(this.props.nominalBaseNodeSize / 2 + 1) - 7)
      .attr("cy", this.props.nominalBaseNodeSize / 2 - 7)
      .attr("fill", "white")
      .attr("stroke-width", 1)
      .attr("stroke", this.props.linkColor)

    // children
    nodeEnter
      .append("text")
      .attr("dx", -(this.props.nominalBaseNodeSize / 2 + 1) - 13)
      .attr("dy", this.props.nominalBaseNodeSize / 2 - 2)
      .attr("class", "icon toggle")
      .style("fill", "#666")
      .style("font-family", "FontAwesome")
      .style("font-size", this.props.nominalBaseNodeSize - 4)
      .text("\uf055")
      .on("click", (node) => this.handleToggleEvent(node))

    // details
    nodeEnter
      .append("text")
      .attr("class", "icon details")
      .style("fill", "#666")
      .style("font-family", "FontAwesome")
      .style("font-size", this.props.nominalBaseNodeSize - 4)
      .attr("dx", -6)
      .attr("dy", -12)
      .text("\uf05a")
      .on("click", (node) => this.showDetails(node))

    var icons = nodeEnter
      .append("text")
      .attr("class", (d) =>
        d.isFetching ? "icon symbol spinner" : "icon symbol"
      )
      .style("fill", this.props.nodeColor)
      .style("font-family", "FontAwesome")
      .style("font-size", (d) => {
        switch (d.cached_object_type) {
          case "floatingip":
            return this.props.nominalBaseNodeSize - 4
          default:
            return this.props.nominalBaseNodeSize
        }
      })
      .attr("dx", -this.props.nominalBaseNodeSize / 2 + 1)
      .attr("dy", this.props.nominalBaseNodeSize / 2 - 2)

    this.nodeElements = nodeEnter.merge(this.nodeElements)

    this.nodeElements.selectAll(".symbol").text((d) => {
      if (d.isFetching) return "\uf110"

      switch (d.cached_object_type) {
        case "network":
          if (d["router:external"]) return "\uf0ac"
          else return "\uf0c2"
        case "server":
          return "\uf0a0"
        case "router":
          return "\uf0e8"
        case "port":
          return "\uf0ec"
        case "security_group":
          return "\uf132"
        case "volume":
          return "\uf1c0"
        case "project":
          return "\uf288"
        case "floatingip":
          //return '\uf0ac'
          return "FIP"
        default:
          return "\uf013"
      }
    })

    // // texts
    // this.textElements = this.textGroup.selectAll('text').data(this.nodes, node => node.id)
    // this.textElements.exit().remove()
    //
    // let textSize = this.zoomScale > 1 ? 5+this.zoomScale*this.zoomScale : 0
    // if(textSize > this.props.maxTextSize) {
    //   textSize = this.props.maxTextSize
    // }
    // var textEnter = this.textElements
    //   .enter()
    //   .append('text')
    //   .text(node => node.label)
    //   .attr('font-size', textSize)
    //   .attr('fill',this.props.nodeColor)
    //   .attr('dx', 19)
    //   .attr('dy', 3)
    // this.textElements = textEnter.merge(this.textElements)

    // Update simulation
    this.simulation.nodes(this.nodes)
    this.simulation.force("link").links(this.links)
    this.simulation.alphaTarget(0.02).restart()
  }

  render() {
    return (
      <>
        <svg ref={this.svgRef} width={this.props.width} height={this.props.height}>
          <g ref={this.graphRef} />
        </svg>
        <div
          className="topology-tooltip"
          ref={this.tooltipRef}
          style={{ display: "none" }}
        ></div>
      </>
    )
  }
}
