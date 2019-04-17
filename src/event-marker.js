import React, { Component } from 'react';

class EventMarker extends Component {
  render() {
    return (
      <g
        className="health-timeline-event"
        transform={ `translate(${ this.props.translate })` }>
        <circle
          cx="0"
          cy="0"
          r={ 10 }
          fill={ this.props.fill }>
        </circle>
        <text
          x="0"
          y="0"
          textAnchor="middle">
            {this.props.data.title}
        </text>
      </g>
    )
  }
}

export default EventMarker;
