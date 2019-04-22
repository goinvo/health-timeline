import React, { Component } from 'react';
import * as d3 from 'd3'; // TODO: Only take what we need
import * as moment from 'moment';

import Axis from './axis';
import EventMarker from './event-marker';

const colors = [
  {
    header: '#8FC5D8',
    background: '#F5FFFF'
  },
  {
    header: '#9DA5CC',
    background: '#EAF2FF'
  },
  {
    header: '#DC8072',
    background: '#FFE6D8'
  },
  {
    header: '#AC599B',
    background: '#FFF2FF'
  },
  {
    header: '#425AA3',
    background: '#DBF3FF'
  }
];

class HealthTimeline extends Component {
  constructor(props) {
    super(props);
    // TODO: Make all these configurable with props (pixelsPerYear, zoomFactor (initial?), outer year range padding, etc)

    this.init(props, false);

    const pixelsPerYear = 10;
    const zoomFactor = 1;
    const allDates = props.events.map((event) => event.date);
    const minDate = moment(props.minDate) || moment(d3.min(allDates)).subtract(10, 'years'); // TODO: min/max from data doesn't seem to be working
    const maxDate = moment(props.maxDate) || moment(d3.max(allDates)).add(10, 'years');
    const totalYears = maxDate.diff(minDate, 'years');
    const height = totalYears * pixelsPerYear;

    const categories = [...new Set(props.events.map((event) => event.category))];

    this.state = {
      width: props.width,
      height,
      categories,
      events: props.events,
      totalYears
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      this.init(nextProps);
    }
  }

  init = (props, shouldSetState = true) => {
    const categories = [...new Set(props.events.map((event) => event.category))];
    const allDates = props.events.map((event) => event.date);
    const pixelsPerYear = 10;
    const minDate = moment(props.minDate) || moment(d3.min(allDates)).subtract(10, 'years'); // TODO: Or support custom start/end dates
    const maxDate = moment(props.maxDate) || moment(d3.max(allDates)).add(10, 'years');
    const yDomain = props.inverted ? [maxDate, minDate] : [minDate, maxDate];
    const totalYears = maxDate.diff(minDate, 'years');
    const height = totalYears * pixelsPerYear;

    this.scaleX = d3.scaleBand()
      .domain(categories)
      .rangeRound([0, props.width]);

    this.scaleY = d3.scaleTime()
      .domain(yDomain)
      .range([0, height]); // TODO: zoom factor?

    this.scaleColor = d3.scaleOrdinal()
      .domain(categories)
      .range(colors)

    if (shouldSetState) {
      this.setState({
        width: props.width,
        height,
        events: props.events,
        categories,
        totalYears
      })
    }
  }

  render() {
    return (
      <div className="health-timeline">
        <div className="health-timeline-header">
          {
            this.state.categories.map((cat, i) => {
              return (
                <div className="health-timeline-header__column" style={{ backgroundColor: this.scaleColor(cat).header }}>
                  { cat }
                </div>
              )
            })
          }
        </div>
        <svg className="health-timeline-svg" width={this.state.width} height={this.state.height}>
          <g className="health-timeline-columns">
            {
              this.state.categories.map((cat) => {
                return (
                  <g className="health-timeline-column"
                     transform={ `translate(${this.scaleX(cat)}, 0)` }>
                    <rect
                      x={ 0 }
                      y={ 0 }
                      width={ this.scaleX.bandwidth() }
                      height={ this.state.height }
                      fill={ this.scaleColor(cat).background }>
                    </rect>
                  </g>
                )
              })
            }
          </g>
          <g className="health-timeline-events">
            {this.state.events.map((event) => {
              return (
                <EventMarker
                  data={event}
                  fill={this.scaleColor(event.category).header}
                  translate={`${this.scaleX(event.category) + (this.scaleX.bandwidth() / 2)}, ${this.scaleY(moment(event.date))}`}
                />
              )
            })}
          </g>
          <Axis scale={this.scaleY} ticks={this.state.totalYears} translate={`translate(0, 0)`}/>
        </svg>
      </div>
    )
  }
}

export default HealthTimeline;
