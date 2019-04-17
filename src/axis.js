import React, { Component } from 'react';
import * as d3 from 'd3';
import * as moment from 'moment';

class Axis extends Component {
  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    const axis = d3.axisLeft()
      .scale(this.props.scale)
      .tickFormat(function(d, i) {
        return moment(d).year() % 10 === 0 ? moment(d).year() : ""
      })
      .tickSize(-10)
      .ticks(this.props.ticks);

    const axisDOM = d3.select(this.axisElement).call(axis);

    // TODO: Letting D3 control selection/DOM here is not ideal.
    axisDOM.selectAll("text")
      .attr("x", 0);
    axisDOM.selectAll("line")
      .filter(function(d, i) {
        return moment(d).year() % 10 === 0;
      })
      .remove();
  }

  render() {
    return (
      <g
        className="health-timeline-axis"
        ref={(el) => { this.axisElement = el; }}
        transform={this.props.translate}
      />
    )
  }
}

export default Axis;
