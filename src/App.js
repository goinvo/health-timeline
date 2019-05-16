import React, { Component } from 'react';
import * as d3 from 'd3';
import Truncate from 'react-truncate';
import Modal from 'react-modal';
import Select from 'react-select';
import jQuery from 'jquery';
import moment from 'moment';

import HealthTimeline from './components/health-timeline';
import Carousel from './components/carousel';
import { load } from './spreadsheet';
import config from './config';

import { ReactComponent as IconCulture } from './images/icons/culture.svg';
import { ReactComponent as IconData } from './images/icons/data.svg';
import { ReactComponent as IconMedicine } from './images/icons/medicine.svg';
import { ReactComponent as IconPolicy } from './images/icons/policy.svg';
import { ReactComponent as IconScience } from './images/icons/science.svg';

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
      dataset: { value: 'all' },
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
      events,
      focusedIndex: 0,
    })
  }

  renderFuture = () => {
    switch (this.state.dataset.value) {
      case 'all':
        return (
          <div>
            <h2>The future of Precision Medicine</h2>
          </div>
        );
        break;
      case 'autism':
        return (
          <div>
            <h2>The future of Precision Autism Medicine</h2>
          </div>
        );
        break;
      case 'cancer':
        return (
          <div>
            <h2>The future of Precision Cancer Medicine</h2>
          </div>
        );
        break;
      default:
        return (
          <div>
            <h2>The future!</h2>
          </div>
        );
    }
  }

  renderIcon = (cat) => {
    switch (cat) {
      case 'Culture':
        return <IconCulture />;
      case 'Data':
        return <IconData />;
      case 'Medicine':
        return <IconMedicine />;
      case 'Policy':
        return <IconPolicy />;
      case 'Science':
        return <IconScience />;
      default:
        return;
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
            <div className="timeline-data-select">
              <div className="timeline-data-select__select">
                <Select
                  value={this.state.dataset}
                  options={this.state.datasets}
                  onChange={this.handleDatasetChange}
                />
              </div>
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
                        <div className="card__content">
                          <div className="card__content-left">
                            { this.renderIcon(event.category) }
                            <p className="text--bold">{ event.category }</p>
                            <p className="text--lg text--bold">{ moment(event.date).year() }</p>
                          </div>
                          <div className="card__content-right">
                            <p className="text--bold">{event.title}</p>
                            <p>
                              <Truncate
                                lines={6}
                                ellipsis={<span>... <button className="button--link" onClick={() => this.readMore(event)}>Read more</button></span>}>
                                {event.body}
                              </Truncate>
                            </p>
                          </div>
                        </div>
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
              <div className="health-timeline-future">
                <div className="health-timeline-future__content">
                  { this.renderFuture() }
                </div>
              </div>
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
