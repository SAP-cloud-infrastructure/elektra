/* eslint-disable no-undef */
import { ResponsiveBar } from "@nivo/bar"
import { useTooltip } from "@nivo/tooltip"
import Legend from "./legend"
require("d3-transition")
import { scaleOrdinal } from "d3-scale"
import Numeral from "numeral"
import React from "react"

class NivoBarChart extends React.Component {
  componentDidMount() {
    this.chartIsRendered()
  }

  // check until chart is rendered
  chartIsRendered = () => {
    if (!$(".barChart svg").length) {
      setTimeout(this.chartIsRendered, 200)
    } else {
      this.fixMyAxis()
    }
  }

  // fix for IE and Firefox
  fixMyAxis = () => {
    const lineTop = $(
      $(".barChart svg>g>g:nth-child(2)>g:nth-child(1) line")[0]
    ).offset().top
    const textTop = $(
      $(".barChart svg>g>g:nth-child(2)>g:nth-child(1) text")[0]
    ).offset().top
    if (Math.abs(lineTop - textTop) < 5) {
      // fix x axis labels
      $(".barChart svg>g>g:nth-child(2)>g:nth-child(1) text").attr(
        "transform",
        "translate(0,20)"
      )
      // fix y axis labels
      $(".barChart svg>g>g:nth-child(2)>g:nth-child(2)>g text").attr(
        "transform",
        "translate(-10,4)"
      )
    }
  }

  // Remove keys to have just an array of objects
  // Reverse array to go from the past to the present
  getData = () => {
    const data = this.props.cost.chartData
    let resultArray = Object.keys(data).map((i) => data[i])
    return resultArray.reverse()
  }

  onClickRect = (recData) => {
    const data = this.props.cost.chartData
    const date = recData.indexValue
    const rawData = data[recData.indexValue]["rawData"]
    const total = data[recData.indexValue]["total"]
    this.props.onClick({ date: date, rawData: rawData, total: total })
  }

  getServiceByColor = (color) => {
    const colorScale = scaleOrdinal()
      .domain(this.props.cost.services)
      .range(this.props.colors)
    let colorIndex = colorScale.range().indexOf(color)
    return colorScale.domain()[colorIndex]
  }

  rectBarComponent = ({ onClick, bar }) => {
    const { clickService, clickedBar } = this.props
    const { x, y, width, height, color, data } = bar
    const { showTooltipFromEvent, hideTooltip } = useTooltip()

    let service = this.getServiceByColor(color)
    const handleTooltip = (e) =>
      showTooltipFromEvent(this.customTooltip(data, color), e)

    let newY = service === clickService ? 240 - height : y
    let opacity = clickService !== "all" && service !== clickService ? 0 : 1
    opacity =
      opacity == 1 && clickedBar !== "none" && data.indexValue !== clickedBar
        ? 0.5
        : opacity

    // hide hideTooltip
    if (opacity == 0) {
      return (
        <rect
          width={width}
          height={height}
          x={x}
          y={newY}
          fill={color}
          opacity={opacity}
        />
      )
    }

    return (
      <rect
        style={{ cursor: "pointer" }}
        width={width}
        height={height}
        x={x}
        y={newY}
        fill={color}
        opacity={opacity}
        onClick={() => onClick(data)}
        onMouseEnter={handleTooltip}
        onMouseMove={handleTooltip}
        onMouseLeave={hideTooltip}
      />
    )
  }

  customTooltip = (node, color) => {
    let total = 0
    node.data.rawData.map((service) => (total += service.price_loc))
    return (
      <div className="customTooltip flex-parent">
        <span className="flex-item" style={{ fontWeight: 500 }}>
          Service
        </span>
        <span className="flex-item">
          <i
            className="fa fa-square header-square service-square"
            style={{ color: color }}
          />{" "}
          {node.id}
        </span>
        <span className="flex-item" style={{ fontWeight: 500 }}>
          Cost
        </span>
        <span className="flex-item">
          {Numeral(node.value).format("0,0.00")} {this.currency()}
        </span>
        <span className="flex-item" style={{ fontWeight: 500 }}>
          Total {node.indexValue}
        </span>
        <span className="flex-item">
          {Numeral(total).format("0,0.00")} {this.currency()}
        </span>
      </div>
    )
  }

  currency = () => {
    const { data } = this.props.cost
    let currency = "EUR"
    if (data.length > 0 && data[0].currency) {
      currency = data[0].currency
    }
    return currency
  }

  render() {
    const { data, services, isFetching, serviceMap } = this.props.cost
    return (
      <>
        {isFetching && (
          <div>
            Loading
            <span className="spinner" />
          </div>
        )}
        {data && data.length == 0 && (
          <div>No data available for this project.</div>
        )}
        {data && data.length > 0 && services && serviceMap && (
          <div className="row">
            <div className="col-sm-10 col-10">
              <div className="barChart">
                <ResponsiveBar
                  data={this.getData()}
                  colors={this.props.colors}
                  margin={{
                    top: 30,
                    bottom: 30,
                    left: 50,
                  }}
                  axisLeft={{
                    orient: "left",
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: this.currency(),
                    legendPosition: "center",
                    legendOffset: -40,
                    format: (v) => Numeral(v).format("0a[.]0"),
                  }}
                  indexBy="date"
                  keys={services}
                  padding={0.2}
                  labelTextColor="inherit:darker(1.4)"
                  labelSkipWidth={16}
                  labelSkipHeight={16}
                  animate={true}
                  motionStiffness={90}
                  motionDamping={15}
                  enableLabel={false}
                  onClick={this.onClickRect}
                  barComponent={this.rectBarComponent}
                />
              </div>
            </div>
            <div className="col-sm-2 col-2">
              <Legend
                height="300"
                colors={this.props.colors}
                services={services}
                serviceMap={serviceMap}
                clickService={this.props.clickService}
                onClickLegend={this.props.onClickLegend}
              />
            </div>
          </div>
        )}
      </>
    )
  }
}
export default NivoBarChart
