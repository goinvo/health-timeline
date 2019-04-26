import React, { Component } from 'react'
import SlickCarousel from 'react-slick'

class Carousel extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activeIndex: props.activeIndex || 0,
    }

    this.carousel = React.createRef()
  }

  goTo = i => {
    this.setState({ activeIndex: i }, () => {
      this.carousel.current.slickGoTo(i)

      if (this.props.onSlideChange) {
        this.props.onSlideChange(i);
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeIndex !== this.props.activeIndex) {
      this.goTo(nextProps.activeIndex);
    }
  }

  componentDidMount() {
    this.heightChanged();
    window.addEventListener('resize', this.heightChanged);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.heightChanged);
  }

  heightChanged = () => {
    // TODO: debounce?
    const height = document.getElementById('health-timeline-carousel') ? document.getElementById('health-timeline-carousel').clientHeight : 0;
    this.props.onHeightChange(height);
  }

  render() {
    const carouselSettings = {
      dots: this.props.dots,
      infinite: this.props.infinite,
      speed: this.props.speed,
      slidesToShow: this.props.slidesToShow,
      slidesToScroll: this.props.slidesToScroll,
      adaptiveHeight: this.props.adaptiveHeight,
      beforeChange: (current, next) => this.goTo(next),
      vertical: true,
      verticalSwiping: true,
    }

    return (
      <div className="health-timeline-carousel" id="health-timeline-carousel">
        <SlickCarousel {...carouselSettings} ref={this.carousel}>
          {this.props.children}
        </SlickCarousel>
      </div>
    )
  }
}

Carousel.defaultProps = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  adaptiveHeight: false,
}

export default Carousel
