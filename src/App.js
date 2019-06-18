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
import futurePM1 from './images/future-precision-medicine-01.jpg';
import futureAutism1 from './images/future-autism-01.jpg';

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

const selectStyles = {
  container: (provided) => ({
    ...provided,
    textAlign: 'center',
  }),
  control: (provided) => ({
    ...provided,
    display: 'inline-flex',
    border: 'none',
  }),
  singleValue: (provided) => ({
    ...provided,
    position: 'static',
    transform: 'none',
    marginRight: '6px',
  }),
  valueContainer: (provided) => ({
    ...provided,
    paddingRight: '0px',
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    display: 'none',
  }),
};

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
      categories: [ 'Medicine', 'Science', 'Data', 'Culture', 'Policy' ],
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
      this.scaleColor = d3.scaleOrdinal()
        .domain(this.state.categories)
        .range(colors)

      const datasets = data.datasets.map(datasetName => ({
        value: datasetName,
        label: datasetName === 'all' ? 'Precision Medicine' : `Precision ${datasetName.charAt(0).toUpperCase() + datasetName.slice(1)} Medicine`
      }));

      const allIndex = datasets.map(d => d.value).indexOf('all');

      datasets.splice(0, 0, datasets.splice(allIndex, 1)[0]);

      const dataset = data.events.filter(event => {
        return event.dataset.includes(datasets[0].value);
      })

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
          <div className="max-width">
            <h2 className="text--center">The future of Precision Medicine</h2>

            <p>By collecting and analyzing data on a population or person's entire life experience, new health insights will emerge. This will lead to more personalized and effective care plans for the individual and for the many, ultimately raising quality of life for all.</p>

            <h4>It’s all about data, a fundamental ingredient</h4>
            <h4>1. Get data early, make better decisions earlier.</h4>
            <p>
              The data collected will encompass all of the social determinants of health and come from many sources such as medical data from electronic health records, all the way to community data on our neighborhoods, towns, and cities.
            </p>

            <img src={futurePM1}></img>

            <h4>1.1 Sharing data</h4>
            <p>
              Collected data will be securely stored in a standardized computable format. We will own our data, enabling us to choose how much of it to share and to whom.<sup>[2]</sup>
            </p>

            <h4>1.2 Understanding data</h4>
            <p>
              Doctors, researchers, and citizen scientists will access and analyze our shared data. Using data science in biomedicine, new patterns will emerge from this valuable public resource, which will be translated into new algorithms for predictive health, and new health discoveries.<sup>[2, 3]</sup>
            </p>

            <h4>2. Moving medicine to proactive care</h4>
            <p>
              Proactive care plan and treatment based on a constantly updating, longitudinal, computable, accurate, at-my-fingertips, digital health record. We will use our newly found insights to address risks and maintain health long before a disease occurs.<sup>[1]</sup>
            </p>

            <p>Genetic insights will allow doctors to know how well a medication will work for you as well as create customized medications, enabling greater drug efficacy while reducing side effects.<sup>[4]</sup></p>

            <p>Understanding not only where your health is, but where it will go, will enable more optimal lines of therapy as well as greater treatment adherence.</p>

            <p>Having these advanced insights into health will save time and money by using the most appropriate treatments based on our needs and what is available, ultimately reducing overall health care expenses for a system that uses almost a fifth of our national expenditure.</p>

            <h4>3. Stage zero detection</h4>
            <h4>3.1 Precision medicine will help specific conditions</h4>
            <p>
              The plan of care for those with diabetes, cancer, Autism Spectrum Disorder, or rare disease are all unique. Through use of this new technology paired with data from those that are similar to us, we will be able to diagnose earlier.
            </p>

            <p>We will be able to take preventative steps through use of individualized diets and lifestyles. We will have more effective choices in antibiotics and targeted drugs, fit exactly for the condition at hand. In overall, Precison medicine will dramatically increase long time survival rate and quality of life.</p>
          </div>
        );
      case 'autism':
        return (
          <div className="max-width">
            <h2 className="text--center">The future of Precision Autism Medicine</h2>

            <h3 className="text--center text--gray">Precision medicine would change our understanding of Autism</h3>

            <p>For parents of children with autism, precision medicine will mean better understanding of their child’s condition, more independence, and fewer meltdowns. For their children, it will mean healthier lives, finding their passions, and developing their abilities for future happiness.</p>

            <h4>Autism care driven by everyday activities and life data</h4>
            <p>
              The care team and child will be a part of recording data on behavior, environment, and other health metrics. By presenting this information in an easily accessible health dashboard, it will empower parents to better understand and track their child’s progress towards their goals. These data stories will seed diagnostic, predictive, and social insights for their child as they transition through life.
            </p>

            <img src={futureAutism1}></img>

            <h4>Early Diagnosis Based on Biomarkers</h4>
            <p>
              Precision medicine would improve early diagnosis by better identifying the causes and risk factors for cases of autism spectrum disorder. High fidelity ODLs (observations of daily living) combined with genetics, and biome data, paving the way for researchers to develop better ASD care plans.<sup>[6]</sup>
            </p>

            <h4>Predict Care Paths</h4>
            <p>
              Tailored therapeutics and medications will treat core symptoms. Biometrics track physiological changes. Near-invisible wearables and ambient devices track surface skin temperature, heart rate, sweating, voice, and gait, in order to predict next hour or next week remedies.<sup>[5]</sup>
            </p>

            <h4>Changing the Narrative</h4>
            <p>
              Future precision medicine efforts will complete the profile of this diverse spectrum. We will understand the molecular and environmental factors that contribute to ASD, to create accurate predictions and therapies.<sup>[7]</sup>
            </p>
          </div>
        );
      case 'cancer':
        return (
          <div>
            <h2>The future of Precision Cancer Medicine</h2>
          </div>
        );
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
            <div className="timeline-header">
              <div className="timeline-header__row">
                <a href="https://goinvo.github.io/PrecisionMedicineMap/">About</a>
                <a href="https://docs.google.com/spreadsheets/d/1UaJB6GqmCOJ9mAaNzEark9Of4AIb7wTx346E7gNlhGE/edit">Suggest events to add to the timeline</a>
                <a href="mailto:timeline@goinvo.com" className="push-right">Feedback</a>
              </div>
              <div className="timeline-data-select">
                <div className="timeline-data-select__select">
                  <Select
                    styles={selectStyles}
                    value={this.state.dataset}
                    options={this.state.datasets}
                    onChange={this.handleDatasetChange}
                    cropWithEllipsis={false}
                    isSearchable={false}
                  />
                </div>
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
              categories={this.state.categories}
              activeCategory={this.state.activeCategory}
              offsetTop={this.state.paddingTop}
              events={this.state.events}
              width={this.state.width}
              onEventClick={this.updateFocusedIndex}
              onFocusedEventChange={this.updateFocusedIndex}
              onScrollBeyondTimeline={this.toggleCarousel}
              colorScale={this.scaleColor}>
              <div className="health-timeline-future">
                <div className="health-timeline-future__content">
                  { this.renderFuture() }

                  <div className="references-container max-width" id="#references">
                    <h4>References</h4>
                    <ul className="references">
                      <li>[1] Snyder, M. (2016). Genomics & personalized medicine, what everyone needs to know: Oxford University Press</li>
                      <li>[2] Topol, E. (2015). INDIVIDUALIZED MEDICINE From Pre-Womb to Tomb. Retrieved May 12: <a href="https://www.ncbi.nlm.nih.gov/pubmed/24679539">https://www.ncbi.nlm.nih.gov/pubmed/24679539</a></li>
                      <li>[3] Precision Medicine: An Action Plan for California. Retrieved April 30, 2019: <a href="http://opr.ca.gov/docs/20190107-Precision_Medicine_An_Action_Plan_for_California.pdf">http://opr.ca.gov/docs/20190107-Precision_Medicine_An_Action_Plan_for_California.pdf</a></li>
                      <li>[4] Brody, B.The Future of Precision Medicine: Retrieve May 1, 2019: <a href="https://www.webmd.com/g00/cancer/features/precision-medicine-what-future-holds?i10c.ua=1&i10c.encReferrer=aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS8%3d&i10c.dv=16">https://www.webmd.com/g00/cancer/features/precision-medicine-what-future-holds?i10c.ua=1&i10c.encReferrer=aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS8%3d&i10c.dv=16</a></li>
                      <li>[5] The future of autism treatment: 4 recent innovations with transformative potential. Retrieved May 15,2019: <a href="https://www.echo.co.uk/blog/the-future-of-autism-treatment-4-recent-innovations-with-transformative-potential">https://www.echo.co.uk/blog/the-future-of-autism-treatment-4-recent-innovations-with-transformative-potential</a></li>
                      <li>[6] Evidence-based and precision medicine: the quest for pragmatic balance in autism. Retrieved. Retrieved April 25,2019: <a href="https://www.futuremedicine.com/doi/full/10.2217/pme.15.35">https://www.futuremedicine.com/doi/full/10.2217/pme.15.35</a></li>
                      <li>[7] The Molecular Genetics of Autism Spectrum Disorders: Genomic Mechanisms, Neuroimmunopathology, and Clinical Implications. Retrieved May 22, 2019: <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3420760/">https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3420760/</a></li>
                    </ul>
                  </div>
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
