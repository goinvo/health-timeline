import React, { Component } from 'react';
import HealthTimeline from './health-timeline';

import './app.css';

const events = [
  {
    title: 'Something 1',
    category: 'Category 1',
    date: '1901'
  },
  {
    title: 'Something 2',
    category: 'Category 2',
    date: '1918'
  },
  {
    title: 'Something 3',
    category: 'Category 1',
    date: '1967'
  },
  {
    title: 'Something 4',
    category: 'Category 3',
    date: '1967'
  },
  {
    title: 'Something 5',
    category: 'Category 4',
    date: '1979'
  },
  {
    title: 'Something 6',
    category: 'Category 2',
    date: '1983'
  },
  {
    title: 'Something 7',
    category: 'Category 1',
    date: '1910'
  },
  {
    title: 'Something 8',
    category: 'Category 5',
    date: '2002'
  }
]

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      width: window.innerWidth
    }
  }

  componentDidMount() {
    this.updateWidth();
    window.addEventListener('resize', this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWidth);
  }

  updateWidth = () => {
    this.setState({ width: window.innerWidth });
  }

  render() {
    return (
      <div className="App">
        <HealthTimeline events={events} width={this.state.width} />
      </div>
    );
  }
}

export default App;
