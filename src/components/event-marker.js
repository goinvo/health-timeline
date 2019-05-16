import React, { Component } from 'react';
// import { Text } from '@vx/text';

class EventMarker extends Component {
  render() {
    // const milestoneHeight = 50;
    // const milestoneWidth = this.props.bandwidth - 40;

    return (
      <g
        className="health-timeline-event"
        transform={ `translate(${ this.props.translate })` }>
        {
          this.props.data.milestone ?
            <circle
              cx="0"
              cy="0"
              r="20"
              fill={ this.props.fill + "44" }>
            </circle>
          : null
        }
        {
          this.props.data.milestone ?
            <circle
              cx="0"
              cy="0"
              className="milestone-ring"
              stroke={ this.props.fill }>
            </circle>
          : null
        }
        <circle
          cx="0"
          cy="0"
          className={ this.props.data.milestone ? "event event--milestone" : "event" }
          fill={ this.props.fill }>
        </circle>
        {/* {
          this.props.data.milestone ?
              <Text
                x="0"
                y="0"
                width={ milestoneWidth - (milestoneWidth * .2) }
                textAnchor="middle"
                verticalAnchor="middle">
                {this.props.data.title}
              </Text>
          : null
        } */}
      </g>
    )
  }
}

export default EventMarker;
