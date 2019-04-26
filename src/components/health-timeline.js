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
    background: '#8FC5D877'
  },
  {
    header: '#9DA5CC',
    background: '#9DA5CC77'
  },
  {
    header: '#DC8072',
    background: '#DC807277'
  },
  {
    header: '#AC599B',
    background: '#AC599B77'
  },
  {
    header: '#425AA3',
    background: '#425AA377'
  }
  // {
  //   header: '#8FC5D8',
  //   background: '#F5FFFF'
  // },
  // {
  //   header: '#9DA5CC',
  //   background: '#EAF2FF'
  // },
  // {
  //   header: '#DC8072',
  //   background: '#FFE6D8'
  // },
  // {
  //   header: '#AC599B',
  //   background: '#FFF2FF'
  // },
  // {
  //   header: '#425AA3',
  //   background: '#DBF3FF'
  // }
];

class HealthTimeline extends Component {
  constructor(props) {
    super(props);
    // TODO: Make all these configurable with props (pixelsPerYear, zoomFactor (initial?), outer year range padding, etc)
    // TODO: Should really make sure the events are sorted by date

    this.init(props, false);

    this.header = React.createRef();

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
      totalYears,
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

  componentDidUpdate() {
    this.truncate(d3.select(this.header.current).selectAll('text'), this.scaleX.bandwidth())
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
      .rangeRound([0, props.width])
      .padding([0.5]);

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
      let scrollPos = e.target.scrollTop + 50; // TODO: 50 is hardcoded representation of header circle offset from top
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
  }, 100);

  handleScroll = (e) => {
    e.persist();
    this.getClosestPointTo(e);
  }

  truncate = (text, width) => {
    text.each(function () {
        const t = d3.select(this);
        const title = t.attr('originaltext').split('');

        t.text('');

        let i = 0;
        while (i < title.length && t.node().getComputedTextLength() < width) {
          t.text(t.text() + title[i]);
          i++;
        }

        if (t.node().getComputedTextLength() >= width && t.text().length < title.length) {
          t.text(t.text() + '...')
        }
    });
  }

  render() {
    // TODO: Timeline header needs to tell timeline body of its height
    return (
      <div className="health-timeline">
        <div className="health-timeline-svg-container" onScroll={this.handleScroll} id="scrollContainer">
          <svg className="health-timeline-svg" width={this.state.width} height={this.state.height}>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: this.scaleColor(this.props.activeCategory).background, stopOpacity: "0.5" }} />
                <stop offset="100%" style={{ stopColor: "#FAF9F9", stopOpacity: "1" }} />
              </linearGradient>
            </defs>
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
                        fill={ this.props.activeCategory === cat ? "url(#grad1)" : "#FAF9F9"}>
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
        <div className="health-timeline-header-container">
          <svg className="health-timeline-header" ref={this.header}>
            {
              this.state.categories.map((cat, i) => {
                return (
                  <g transform={ `translate(${this.scaleX(cat)}, 0)` }>
                    <text
                      x={ this.scaleX.bandwidth() / 2 }
                      y="20"
                      textAnchor="middle"
                      originaltext={cat}>
                      {cat}
                    </text>
                    <circle
                      className="health-timeline-header__column"
                      cx={ this.scaleX.bandwidth() / 2 }
                      cy="50"
                      r={ cat === this.props.activeCategory ? 20 : 16 }
                      fill={ this.scaleColor(cat).background }
                      stroke={ this.scaleColor(cat).header }
                      strokeWidth={ this.props.activeCategory ? 7 : 5 }
                    />
                  </g>
                )
              })
            }
          </svg>
        </div>
      </div>
    )
  }
}

export default HealthTimeline;
