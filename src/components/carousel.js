import React, { Component } from 'react'
import SlickCarousel from 'react-slick'

class Carousel extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activeIndex: 0,
    }

    this.carousel = React.createRef()
  }

  goTo = i => {
    this.setState({ activeIndex: i }, () => {
      this.carousel.current.slickGoTo(i)
    })
  }

  render() {
    const carouselSettings = {
      dots: this.props.dots,
      infinite: this.props.infinite,
      speed: this.props.speed,
      slidesToShow: this.props.slidesToShow,
      slidesToScroll: this.props.slidesToScroll,
      adaptiveHeight: this.props.adaptiveHeight,
      beforeChange: (current, next) => this.setState({ activeIndex: next }),
    }

    return (
      <div className="health-timeline-carousel">
        <SlickCarousel {...carouselSettings} ref={this.carousel}>
          {this.props.children}
        </SlickCarousel>
      </div>
    )
  }
}

Carousel.defaultProps = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  adaptiveHeight: true,
}

export default Carousel
