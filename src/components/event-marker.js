import React, { Component } from 'react';
import { Text } from '@vx/text';

class EventMarker extends Component {
  render() {
    const milestoneHeight = 50;
    const computedWidth = this.props.bandwidth - 40;
    const milestoneWidth = computedWidth > 30 ? computedWidth : 30;

    return (
      <g
        className="health-timeline-event"
        transform={ `translate(${ this.props.translate })` }>
        {
          this.props.data.milestoneText ?
            <circle
              cx="0"
              cy="0"
              r="20"
              fill={ this.props.fill + "44" }>
            </circle>
          : null
        }
        {
          this.props.data.milestoneText ?
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
          className={ this.props.data.milestoneText ? "event event--milestone" : "event" }
          fill={ this.props.fill }>
        </circle>
        {
          this.props.renderText && this.props.data.milestoneText ?
              <Text
                x={ this.props.alignText === 'end' ? -25 : 25 }
                y="0"
                width={ milestoneWidth }
                textAnchor={this.props.alignText}
                verticalAnchor="middle">
                {this.props.data.milestoneText}
              </Text>
          : null
        }
      </g>
    )
  }
}

export default EventMarker;
