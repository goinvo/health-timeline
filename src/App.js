import React, { Component } from 'react';
import * as d3 from 'd3';
import * as Scroll from 'react-scroll'; // TODO: import only what's needed
import Truncate from 'react-truncate';
import Modal from 'react-modal';

import HealthTimeline from './components/health-timeline';
import Carousel from './components/carousel';
import { load } from './spreadsheet';
import config from './config';

import './app.scss';

const scroll = Scroll.animateScroll;

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
];

Modal.setAppElement('#root');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [],
      width: window.innerWidth,
      error: null,
      focusedIndex: 0,
      paddingTop: 0,
      activeCategory: null,
      readMoreEvent: null,
      modalIsOpen: false,
    }

    this.scaleColor = d3.scaleOrdinal()
      .domain([])
      .range(colors);
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
      const categories = [...new Set(data.events.map((event) => event.category))];
      this.scaleColor = d3.scaleOrdinal()
        .domain(categories)
        .range(colors)
      this.setState({ events: data.events, activeCategory: data.events[0].category });
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
    this.setState({ focusedIndex: i, activeCategory: this.state.events[i].category });
  }

  scrollToEvent = (pos, newIndex = null) => {
    const indexChanged = !(newIndex === null);

    const args = {
      containerId: 'scrollContainer', // TODO: Should use ref from component here instead?
      duration: indexChanged ? 300 : 750
    }

    scroll.scrollTo(pos - 50, args); // TODO: 50 is hardcoded representation of header circle offset from top

    if (indexChanged) {
      this.updateFocusedIndex(newIndex);
    }
  }

  readMore = (text) => {
    this.setState({
      readMoreEvent: text,
    }, () => {
      this.openModal();
    });
  }

  openModal = () => {
    this.setState({modalIsOpen: true});
  }

  closeModal = () => {
    this.setState({modalIsOpen: false});
  }

  unlockScrolling = (pastEnd) => {
    if (pastEnd) {
      document.body.classList.add('unlocked');
    } else {
      document.body.classList.remove('unlocked');
    }
  }

  render() {
    if (this.state.error) {
      return <div>{this.state.error.message}</div>;
    }

    if (this.state.events.length) {
      const modalStyles = {
        content : {
          top: '5px',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          border: 'none',
          padding: '0',
          marginRight: '-50%',
          transform: 'translate(-50%, 0%)'
        }
      };

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
                    <div className="card" style={{ backgroundColor: this.scaleColor(event.category).header }}>
                      <p><b>{event.title}</b></p>
                      <p>
                        <Truncate
                          lines={6}
                          ellipsis={<span>... <button className="button--link" onClick={() => this.readMore(event)}>Read more</button></span>}>
                          {event.body}
                        </Truncate>
                      </p>
                    </div>
                  </div>
                )
              })}
            </Carousel>
            {
              // TODO: minDate and maxDate are placeholders
            }
            <HealthTimeline
              focusedIndex={this.state.focusedIndex}
              activeCategory={this.state.activeCategory}
              offsetTop={this.state.paddingTop}
              events={this.state.events}
              width={this.state.width}
              minDate="1880"
              maxDate="2080"
              onEventClick={this.updateFocusedIndex}
              onFocusedEventChange={this.scrollToEvent}
              onReachEnd={this.unlockScrolling}
              colorScale={this.scaleColor} />
          </div>
          <div className="future">
            <h1>Mooooaaaaarrrrr!</h1>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
            <p>Here is more content y'all. Hell yeah. Let's keep scrolling.</p>
          </div>

          <Modal
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal}
            style={modalStyles}
            contentLabel="Read full text from event">
            <div className="card" style={{ backgroundColor: this.state.readMoreEvent ? this.scaleColor(this.state.readMoreEvent.category).header : '#fff', height: 'auto', maxHeight: '90vh', margin: '0' }}>
              {
                this.state.readMoreEvent ?
                <div>
                  <p><b>{this.state.readMoreEvent.title}</b></p>
                  <p>{this.state.readMoreEvent.body}</p>
                  <button className="button--link" onClick={this.closeModal}>Close</button>
                </div>
                : null
              }
            </div>
          </Modal>
        </div>
      );
    }

    return <div>Loading...</div>;
  }
}

export default App;
