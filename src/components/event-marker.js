import React, { Component } from 'react';
import { Text } from '@vx/text';

class EventMarker extends Component {

  handleClick = () => {

  }

  render() {
    const milestoneHeight = 50;
    const milestoneWidth = this.props.bandwidth - 40;

    return (
      <g
        className="health-timeline-event"
        transform={ `translate(${ this.props.translate })` }>
        {
          this.props.data.milestone ?
          <g>
            <rect
              x={ -(milestoneWidth / 2) }
              y={ -(milestoneHeight / 2) }
              width={ milestoneWidth }
              height={ milestoneHeight }
              rx="25"
              ry="25"
              stroke={ this.props.fill }
              strokeWidth={ this.props.focused ? 5 : 2 }
              fill="#fff"/>
              <Text
                x="0"
                y="0"
                width={ milestoneWidth - (milestoneWidth * .2) }
                textAnchor="middle"
                verticalAnchor="middle">
                {this.props.data.title}
              </Text>
          </g>
          :
            <circle
              cx="0"
              cy="0"
              r={ this.props.focused ? 10: 5 }
              fill={ this.props.fill }>
            </circle>
        }
      </g>
    )
  }
}

export default EventMarker;
