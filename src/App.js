import React, { Component } from 'react';
import HealthTimeline from './components/health-timeline';
import Carousel from './components/carousel';
import { load } from './spreadsheet';
import config from './config';

import './app.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [],
      width: window.innerWidth,
      error: null,
      activeIndex: 0,
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
    this.setState({ width: window.innerWidth });
  }

  render() {
    if (this.state.error) {
      return <div>{this.state.error.message}</div>;
    }

    if (this.state.events.length) {
      return (
        <div className="App">
          <Carousel>
            {this.state.events.map(event => {
              return (
                <div>{event.title}</div>
              )
            })}
          </Carousel>
          {
            // TODO: minDate and maxDate are placeholders
          }
          <HealthTimeline
            events={this.state.events}
            width={this.state.width}
            minDate="1880"
            maxDate="2020" />
        </div>
      );
    }

    return <div>Loading...</div>;
  }
}

export default App;
