import React, { Component } from 'react';
import * as d3 from 'd3'; // TODO: Only take what we need
import * as moment from 'moment';
import * as Scroll from 'react-scroll'; // TODO: Only take what we need
import { debounce } from 'lodash';

import Axis from './axis';
import EventMarker from './event-marker';

const Events = Scroll.Events;

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
    // TODO: Should really make sure the events are sorted by date

    this.init(props, false);

    this.scrollContainer = React.createRef();

    const pixelsPerYear = 20;
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

      if (this.props.onFocusedEventChange && (nextProps.focusedIndex !== this.props.focusedIndex)) {
        const pos = this.scaleY(moment(this.state.events[nextProps.focusedIndex].date));
        this.props.onFocusedEventChange(pos);
      }
    }
  }

  init = (props, shouldSetState = true) => {
    const categories = [...new Set(props.events.map((event) => event.category))];
    const allDates = props.events.map((event) => event.date);
    const pixelsPerYear = 20;
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

  handleEventClick = (i) => {
    if (this.props.onEventClick) {
      this.props.onEventClick(i);
    }
  }

  getClosestPointTo = debounce((e) => {
    let closest = null;
    let closestDistance = null;
    let closestIndex = 0;

    this.state.events.forEach((event, i) => {
      let eventPos = this.scaleY(moment(event.date));
      let scrollPos = e.target.scrollTop;
      if (i === 0) {
        closest = eventPos;
        closestDistance = Math.abs(eventPos - scrollPos);
      } else {
        let thisDistance = Math.abs(eventPos - scrollPos);
        if (thisDistance <= closestDistance) {
          closest = eventPos;
          closestDistance = thisDistance;
          closestIndex = i;
        }
      }
    })

    if (this.props.onFocusedEventChange) {
      this.props.onFocusedEventChange(closest, closestIndex);
    }
  }, 300);

  handleScroll = (e) => {
    e.persist();
    this.getClosestPointTo(e);
  }

  render() {
    // TODO: Timeline header needs to tell timeline body of its height
    return (
      <div className="health-timeline" ref={this.scrollContainer} onScroll={this.handleScroll} id="scrollContainer">
        {/* <div className="health-timeline-header" style={{ top: this.props.offsetTop || 0 }}>
          {
            this.state.categories.map((cat, i) => {
              return (
                <div className="health-timeline-header__column" style={{ backgroundColor: this.scaleColor(cat).header }}>
                  { cat }
                </div>
              )
            })
          }
        </div> */}
        <div className="health-timeline-svg-container">
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
              {this.state.events.map((event, i) => {
                return (
                  <g onClick={() => this.handleEventClick(i)}>
                    <EventMarker
                      focused={this.props.focusedIndex === i}
                      data={event}
                      fill={this.scaleColor(event.category).header}
                      bandwidth={this.scaleX.bandwidth()}
                      translate={`${this.scaleX(event.category) + (this.scaleX.bandwidth() / 2)}, ${this.scaleY(moment(event.date))}`}
                    />
                  </g>
                )
              })}
            </g>
            <Axis scale={this.scaleY} ticks={this.state.totalYears} translate={`translate(0, 0)`}/>
          </svg>
        </div>
      </div>
    )
  }
}

export default HealthTimeline;
