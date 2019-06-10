import React, { Component } from 'react';
import * as d3 from 'd3'; // TODO: Only take what we need
import * as moment from 'moment';
import { Events, animateScroll } from 'react-scroll';
import { debounce, throttle } from 'lodash';
import { Text } from '@vx/text';

import Axis from './axis';
import EventMarker from './event-marker';

import { ReactComponent as IconZoomIn } from '../images/icons/zoom-in.svg';
import { ReactComponent as IconZoomOut } from '../images/icons/zoom-out.svg';

const scroll = animateScroll;
const scrollEvents = Events;

const headerCircleCY = 50;

class HealthTimeline extends Component {
  constructor(props) {
    super(props);
    // TODO: Make all these configurable with props (pixelsPerYear, zoomFactor (initial?), outer year range padding, etc)

    this.state = {
      width: props.width,
      zoomFactor: 1,
      headerClass: '',
      scrolling: false,
    };

    this.init(props, true);

    this.header = React.createRef();
    this.scrollContainer = React.createRef();
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

  init = (props, constructorCall = false, scrollTransition = true) => {
    const categories = props.categories || [...new Set(props.events.map((event) => event.category))];
    const events = props.events.concat().sort((a, b) => {
      return moment.utc(a.timeStamp).diff(moment.utc(b.timeStamp));
    })

    const allDates = props.events.map((event) => moment(event.date));
    const minDate = props.minDate ? moment(props.minDate) : moment.min(allDates).subtract(5, 'years');
    const maxDate = props.maxDate ? moment(props.maxDate) : moment.max(allDates);
    const totalYears = maxDate.diff(minDate, 'years');

    const pixelsPerYear = props.pixelsPerYear ? props.pixelsPerYear : 20;
    const yDomain = props.inverted ? [maxDate, minDate] : [minDate, maxDate];
    const timelineHeight = totalYears * pixelsPerYear;

    this.scaleX = d3.scaleBand()
      .domain(categories)
      .rangeRound([0, props.width])
      .padding([0.5]);

    this.scaleY = d3.scaleTime()
      .domain(yDomain)
      .range([0, timelineHeight * this.state.zoomFactor]);

    if (constructorCall) {
      this.state.categories = categories;
      this.state.events = events;
      this.state.totalYears = totalYears;
      this.state.maxDate = maxDate;
    } else {
      this.setState({
        width: props.width,
        events,
        categories,
        totalYears,
        maxDate,
      }, () => {
        const pos = this.scaleY(moment(this.state.events[props.focusedIndex].date));
        this.scrollToEvent(pos, scrollTransition ? null : 0);
      })
    }
  }

  handleEventClick = (i) => {
    if (this.props.onEventClick) {
      this.props.onEventClick(i);
    }
  }

  scrollToEvent = (pos, dur = 750) => {
    const args = {
      containerId: this.scrollContainer.current.id, // NOTE: Doesn't seem possible to pass the element here, needs an ID for this library
      duration: dur
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

  zoom = (dir) => {
    if (dir === 'in') {
      if (this.state.zoomFactor < 3) {
        this.setState({
          zoomFactor: this.state.zoomFactor + 0.5
        }, () => {
          this.init(this.props, false, false);
        });
      }
    } else {
      if (this.state.zoomFactor > 1) {
        this.setState({
          zoomFactor: this.state.zoomFactor - 0.5
        }, () => {
          this.init(this.props, false, false);
        });
      }
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
    const endOfTimelinePos = this.scaleY(this.state.maxDate);
    const pathHeight = this.state.width < 700 ? 200 : 400;
    const combineHeight = this.state.width < 700 ? 300 : 450;
    const totalHeight = endOfTimelinePos + pathHeight + combineHeight;

    return (
      <div className="health-timeline">
        <div className="zoom-controls">
          <button className="button--transparent" onClick={() => this.zoom('in')}><IconZoomIn /></button>
          <button className="button--transparent" onClick={() => this.zoom('out')}><IconZoomOut /></button>
        </div>
        <div className="health-timeline-svg-container" onScroll={this.handleScroll} id="health-timeline-scroll-container" ref={this.scrollContainer}>
          <svg className="health-timeline-svg" width={this.state.width} height={totalHeight}>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: this.props.colorScale(this.props.activeCategory).background }} />
                <stop offset="99%" style={{ stopColor: this.props.colorScale(this.props.activeCategory).background }} />
                <stop offset="100%" style={{ stopColor: "#FAF9F9" }} />
              </linearGradient>
              <clipPath id="circle-left">
                <rect x="0" y="-10" width="10" height="20"/>
              </clipPath>
            </defs>
            <g className="health-timeline-columns">
              {
                this.state.categories.map((cat) => {
                  const middleColPos = (this.state.width / 2) - this.scaleX(cat);
                  return (
                    <g className="health-timeline-column"
                       transform={ `translate(${this.scaleX(cat)}, 0)` }>
                      <rect
                        x={ 0 }
                        y={ 0 }
                        width={ this.scaleX.bandwidth() }
                        height={ endOfTimelinePos }
                        fill={ this.props.activeCategory === cat ? "url(#grad1)" : "#FAF9F9"}>
                      </rect>
                      <path
                        transform={ `translate(0, ${endOfTimelinePos})`}
                        d={`M${ this.scaleX.bandwidth() / 2},0C${ this.scaleX.bandwidth() / 2},${pathHeight / 2} ${middleColPos},${pathHeight / 2} ${middleColPos},${pathHeight}`}
                        fill="none"
                        stroke="#FAF9F9"
                        strokeWidth={ this.scaleX.bandwidth() }>
                      </path>
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
                      renderText={ this.state.width > 800 }
                      alignText={ (this.scaleX(event.category) === this.scaleX(this.state.categories[this.state.categories.length - 1])) ? 'end' : 'start' }
                      translate={`${this.scaleX(event.category) + (this.scaleX.bandwidth() / 2)}, ${this.scaleY(moment(event.date))}`}
                    />
                  </g>
                )
              })}
            </g>
            <Axis scale={this.scaleY} ticks={this.state.totalYears} translate={`translate(0, 0)`}/>
            <g
              transform={ `translate(${this.state.width / 2}, ${endOfTimelinePos + pathHeight})`}>
              <rect
                x={ -(this.scaleX.bandwidth() / 2) }
                y={ 0 }
                width={ this.scaleX.bandwidth() }
                height={ combineHeight }
                fill="#FAF9F9">
              </rect>
              <g transform="translate(0, 0)">
                <circle cx="0" cy="0" r="10" style={{ fill: this.props.colorScale(this.state.categories[4]).header, strokeWidth: 4 }}/>
                <circle cx="0" cy="0" r="10" style={{ fill: this.props.colorScale(this.state.categories[3]).header, clipPath: "url(#circle-left)" }}/>
                <Text
                  width={this.state.width / 2.5}
                  x="20"
                  y="-5"
                  verticalAnchor="start"
                  textAnchor="start">Get data early, make better decisions earlier.</Text>
              </g>
              <g transform={`translate(0, ${combineHeight * .33})`}>
                <circle cx="0" cy="0" r="10" style={{ fill: this.props.colorScale(this.state.categories[1]).header, strokeWidth: 4 }}/>
                <circle cx="0" cy="0" r="10" style={{ fill: this.props.colorScale(this.state.categories[0]).header, clipPath: "url(#circle-left)" }}/>
                <Text
                  width={this.state.width / 2.5}
                  x="20"
                  y="-5"
                  verticalAnchor="start"
                  textAnchor="start">Proactive care.</Text>
              </g>
              <g transform={`translate(0, ${combineHeight * .66})`}>
                <circle cx="0" cy="0" r="10" style={{ fill: this.props.colorScale(this.state.categories[0]).header, strokeWidth: 4 }}/>
                <circle cx="0" cy="0" r="10" style={{ fill: this.props.colorScale(this.state.categories[2]).header, clipPath: "url(#circle-left)" }}/>
                <Text
                  width={this.state.width / 2.5}
                  x="20"
                  y="-5"
                  verticalAnchor="start"
                  textAnchor="start">Stage Zero Detection.</Text>
              </g>
            </g>
          </svg>
          <div className="health-timeline-children" style={{ top: totalHeight }}>
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
