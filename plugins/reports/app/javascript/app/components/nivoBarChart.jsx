import { ResponsiveBar } from '@nivo/bar'
import Legend from './legend'
import { scaleOrdinal } from 'd3-scale'
import { CSSTransition } from 'react-transition-group';

class NivoBarChart extends React.Component {


  // Remove keys to have just an array of objects
  // Reverse array to go from the past to the present
  getData = () => {
    const data = this.props.cost.chartData
    let resultArray = Object.keys(data).map(i => data[i])
    return resultArray.reverse()
  }

  onClickRect = (recData) => {
    const data = this.props.cost.chartData
    const date = recData.indexValue
    const rawData = data[recData.indexValue]["rawData"]
    const total = data[recData.indexValue]["total"]
    this.props.onClick({date: date, rawData: rawData, total: total})
  }

  getServiceByColor = (color) => {
    const colorScale = scaleOrdinal()
      .domain(this.props.cost.services)
      .range(this.props.colors)
    let colorIndex = colorScale.range().indexOf(color)
    return colorScale.domain()[colorIndex]
  }

  rectBarComponent = ({ x, y, width, height, color, data, onClick, tooltip, showTooltip, hideTooltip}) => {
    const {clickService,clickedBar} = this.props
    let service = this.getServiceByColor(color)
    const handleTooltip = e => showTooltip(this.customTooltip(data, color), e)

    let newY = (service === clickService) ? 240-height : y
    let opacity = (clickService !== "all" && service !== clickService) ? 0 : 1
    opacity = (opacity == 1 && clickedBar!== "none" && data.indexValue !== clickedBar) ? 0.5 : opacity

    // hide hideTooltip
    if (opacity == 0) {
      return <rect width={width} height={height} x={x} y={newY} fill={color} opacity={opacity}/>
    }

    return <rect style={{ cursor: "pointer" }} width={width} height={height} x={x} y={newY} fill={color} opacity={opacity} onClick={() => onClick(data)}
              onMouseEnter={handleTooltip}
              onMouseMove={handleTooltip}
              onMouseLeave={hideTooltip}/>
  }

  customTooltip = (node, color) => {
    let total = 0
    node.data.rawData.map(service => total += service.price_loc)
    return (<div className="customTooltip">
        <span style={{ fontWeight: 500 }}>Service</span>
        <span><i className="fa fa-square header-square" style={{color: color}}/> {node.id}</span>
        <span style={{ fontWeight: 500 }}>Cost</span>
        <span>{parseFloat(node.value).toFixed(2)} {this.currency()}</span>
        <span style={{ fontWeight: 500 }}>Total {node.indexValue}</span>
        <span>{parseFloat(total).toFixed(2)} {this.currency()}</span>
    </div>)
  }

  currency = () => {
    const {data} = this.props.cost
    let currency = "EUR"
    if (data.length > 0 && data[0].currency) {
      currency = data[0].currency
    }
    return currency
  }

  render() {
    const {data,services,isFetching,serviceMap} = this.props.cost
    return (
      <React.Fragment>
        {isFetching &&
          <div>
            Loading
            <span className="spinner"/>
          </div>
        }
        {data && data.length == 0 &&
          <div>
            No data available for this project.
          </div>
        }
        {data && data.length > 0 && services && serviceMap &&
          <div className="row">
            <div className="col-sm-10 col-xs-10">
              <div className="barChart">
                <ResponsiveBar
                  data={this.getData()}
                  colors={this.props.colors}
                  margin={{
                    top: 30,
                    bottom: 30,
                    left: 50
                  }}
                  axisLeft={{
                      "orient": "left",
                      "tickSize": 5,
                      "tickPadding": 5,
                      "tickRotation": 0,
                      "legend": this.currency(),
                      "legendPosition": "center",
                      "legendOffset": -40
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
            <div className="col-sm-2 col-xs-2">
              <Legend height="300" colors={this.props.colors} services={services} serviceMap={serviceMap} clickService={this.props.clickService} onClickLegend={this.props.onClickLegend}/>
            </div>
          </div>

        }
      </React.Fragment>
    )
  }
}
export default NivoBarChart;
