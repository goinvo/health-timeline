import React, { Component } from 'react';
import * as Scroll from 'react-scroll'; // TODO: import only what's needed

import HealthTimeline from './components/health-timeline';
import Carousel from './components/carousel';
import { load } from './spreadsheet';
import config from './config';

import './app.scss';

const scroll = Scroll.animateScroll;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [],
      width: window.innerWidth,
      error: null,
      focusedIndex: 0,
      paddingTop: 0,
    }
  }

  componentDidMount() {
    window.gapi.load("client", this.initClient);

    this.updateWidth();
    window.addEventListener('resize', this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWidth);
  }

  initClient = () => {
    window.gapi.client
      .init({
        apiKey: config.apiKey,
        discoveryDocs: config.discoveryDocs
      })
      .then(() => {
        load(this.onLoad);
      })
  }

  onLoad = (data, error) => {
    if (data) {
      this.setState({ events: data.events });
    } else {
      this.setState({ error })
    }
  }

  updateWidth = () => {
    // TODO: debounce?
    this.setState({ width: window.innerWidth });
  }

  updatePaddingOffset = (carouselHeight = null) => {
    this.setState({ paddingTop: carouselHeight });
  }

  updateFocusedIndex = (i) => {
    this.setState({ focusedIndex: i });
  }

  scrollToEvent = (pos, newIndex = null) => {
    const indexChanged = !(newIndex === null);

    const args = {
      containerId: 'scrollContainer', // TODO: Should use ref from component here instead?
      duration: indexChanged ? 300 : 750
    }

    scroll.scrollTo(pos, args);

    if (indexChanged) {
      this.updateFocusedIndex(newIndex);
    }
  }

  render() {
    if (this.state.error) {
      return <div>{this.state.error.message}</div>;
    }

    if (this.state.events.length) {
      return (
        <div className="App">
          <div className="timeline-wrapper">
            <Carousel
              activeIndex={this.state.focusedIndex}
              onHeightChange={this.updatePaddingOffset}
              onSlideChange={this.updateFocusedIndex}>
              {this.state.events.map(event => {
                return (
                  <div>
                    <br/>
                    <div>{event.title}</div>
                    <br/>
                    <div>{event.body}</div>
                    <br/>
                  </div>
                )
              })}
            </Carousel>
            {
              // TODO: minDate and maxDate are placeholders
            }
            <HealthTimeline
              focusedIndex={this.state.focusedIndex}
              offsetTop={this.state.paddingTop}
              events={this.state.events}
              width={this.state.width}
              minDate="1880"
              maxDate="2020"
              onEventClick={this.updateFocusedIndex}
              onFocusedEventChange={this.scrollToEvent} />
          </div>
        </div>
      );
    }

    return <div>Loading...</div>;
  }
}

export default App;
