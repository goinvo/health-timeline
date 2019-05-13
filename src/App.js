import React, { Component } from 'react';
import * as d3 from 'd3';
import Truncate from 'react-truncate';
import Modal from 'react-modal';
import Select from 'react-select';
import jQuery from 'jquery';

import HealthTimeline from './components/health-timeline';
import Carousel from './components/carousel';
import { load } from './spreadsheet';
import config from './config';

import './app.scss';

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
      allEvents: [],
      width: window.innerWidth,
      error: null,
      focusedIndex: 0,
      paddingTop: 0,
      activeCategory: null,
      readMoreEvent: null,
      modalIsOpen: false,
      datasets: [],
      dataset: 'all',
    }

    this.carouselWrapper = React.createRef();

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

      const dataset = data.events.filter(event => {
        return event.dataset.includes(data.datasets[0]);
      });

      const datasets = data.datasets.map(datasetName => ({
        value: datasetName,
        label: datasetName === 'all' ? 'Precision Medicine' : `Precision ${datasetName.charAt(0).toUpperCase() + datasetName.slice(1)} Medicine`
      }));

      this.setState({
        events: dataset,
        allEvents: data.events,
        datasets,
        dataset: datasets[0],
        activeCategory: data.events[0].category
      });
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

  toggleCarousel = (beyondScrollAmount) => {
    const calcMaxHeight = 220 - beyondScrollAmount;
    const maxHeight = calcMaxHeight >= 220 ? 220 : calcMaxHeight <= 0 ? 0 : calcMaxHeight;
    // NOTE: I don't know why this commented out line doesn't work,
    // but using jQuery does. Would be lovely to avoid using jQuery though.
    // this.carouselWrapper.current.style.maxHeight = maxHeight;
    jQuery(this.carouselWrapper.current).css('max-height', maxHeight);
  }

  handleDatasetChange = (dataset) => {

    const events = this.state.allEvents.filter(event => {
      return event.dataset.includes(dataset.value);
    });

    this.setState({
      dataset,
      events
    })
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
            <div className="timeline-data-select">
              <Select
                value={this.state.dataset}
                options={this.state.datasets}
                onChange={this.handleDatasetChange}
              />
            </div>
            <div className="carousel-wrapper" ref={this.carouselWrapper}>
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
            </div>
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
              onFocusedEventChange={this.updateFocusedIndex}
              onScrollBeyondTimeline={this.toggleCarousel}
              colorScale={this.scaleColor}>
            </HealthTimeline>
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
