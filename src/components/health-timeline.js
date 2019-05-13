import React, { Component } from 'react';
import * as d3 from 'd3'; // TODO: Only take what we need
import * as moment from 'moment';
import { Events, animateScroll } from 'react-scroll';
import { debounce, throttle } from 'lodash';

import Axis from './axis';
import EventMarker from './event-marker';

const scroll = animateScroll;
const scrollEvents = Events;

const headerCircleCY = 50;

class HealthTimeline extends Component {
  constructor(props) {
    super(props);
    // TODO: Make all these configurable with props (pixelsPerYear, zoomFactor (initial?), outer year range padding, etc)
    // TODO: Should really make sure the events are sorted by date

    this.init(props, false);

    this.header = React.createRef();
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
      totalYears,
      headerClass: '',
      scrolling: false,
    };
  }

  componentDidMount() {
    scrollEvents.scrollEvent.register('end', () => {
      if (this.state.scrolling) {
        this.setState({ scrolling: false });
      }
    });

    const pos = this.scaleY(moment(this.state.events[this.props.focusedIndex].date));
    this.scrollToEvent(pos);
  }

  componentWillUnmount() {
    scrollEvents.scrollEvent.remove('end');
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      this.init(nextProps);

      if (nextProps.focusedIndex !== this.props.focusedIndex) {
        const pos = this.scaleY(moment(this.state.events[nextProps.focusedIndex].date));
        this.scrollToEvent(pos);
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

  scrollToEvent = (pos) => {
    const args = {
      containerId: this.scrollContainer.current.id, // NOTE: Doesn't seem possible to pass the element here, needs an ID for this library
      duration: 750
    }

    this.setState({ scrolling: true }, () => {
      scroll.scrollTo(pos - headerCircleCY, args);
    })
  }

  getClosestPointTo = debounce((e) => {
    let closest = null;
    let closestDistance = null;
    let closestIndex = 0;

    this.state.events.forEach((event, i) => {
      let eventPos = this.scaleY(moment(event.date));
      let scrollPos = e.target.scrollTop + headerCircleCY;
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

    this.scrollToEvent(closest, closestIndex);
    if (this.props.onFocusedEventChange) {
      this.props.onFocusedEventChange(closestIndex);
    }
  }, 100);

  toggleBeyondScroll = (beyondScrollAmount) => {
    if (this.props.onScrollBeyondTimeline && beyondScrollAmount) {
      this.props.onScrollBeyondTimeline(beyondScrollAmount);
      this.setState({ headerClass: 'is-hidden'});
    } else {
      this.props.onScrollBeyondTimeline(beyondScrollAmount);
      this.setState({ headerClass: ''});
    }
  }

  checkScrollOperations = throttle((e) => {
    let scrollPos = e.target.scrollTop;
    let targetPos = this.scaleY(moment(this.state.events[this.state.events.length - 1].date));

    if (scrollPos >= targetPos) {
      this.toggleBeyondScroll(parseInt(scrollPos - targetPos));
    } else {
      this.toggleBeyondScroll(0);
      this.getClosestPointTo(e);
    }
  }, 10);

  handleScroll = (e) => {
    e.persist();

    if (!this.state.scrolling) {
      this.checkScrollOperations(e);
    }
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
    return (
      <div className="health-timeline">
        <div className="health-timeline-svg-container" onScroll={this.handleScroll} id="health-timeline-scroll-container" ref={this.scrollContainer}>
          <svg className="health-timeline-svg" width={this.state.width} height={this.state.height}>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: this.props.colorScale(this.props.activeCategory).background, stopOpacity: "0.5" }} />
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
                      fill={this.props.colorScale(event.category).header}
                      bandwidth={this.scaleX.bandwidth()}
                      translate={`${this.scaleX(event.category) + (this.scaleX.bandwidth() / 2)}, ${this.scaleY(moment(event.date))}`}
                    />
                  </g>
                )
              })}
            </g>
            <Axis scale={this.scaleY} ticks={this.state.totalYears} translate={`translate(0, 0)`}/>
          </svg>
          <div className="health-timeline-children" style={{ top: this.scaleY(moment(this.state.events[this.state.events.length - 1].date).add(10, 'years')) }}>
            { this.props.children }
          </div>
        </div>
        <div className="health-timeline-header-container">
          <svg className={`health-timeline-header ${this.state.headerClass}`} ref={this.header}>
            <defs>
              <linearGradient id="grad-header" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#fff", stopOpacity: "1" }} />
                <stop offset="100%" style={{ stopColor: "#fff", stopOpacity: "0" }} />
              </linearGradient>
            </defs>
            <rect
              x={ 0 }
              y={ 0 }
              width={ this.state.width }
              height={ headerCircleCY }
              fill="url(#grad-header)">
            </rect>
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
                      cy={ headerCircleCY }
                      r={ cat === this.props.activeCategory ? 20 : 16 }
                      fill={ this.props.colorScale(cat).background }
                      stroke={ this.props.colorScale(cat).header }
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
