import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isCordova } from '../../utils/cordovaUtils';
import { renderLog } from '../../utils/logging';

export default class IntroNetworkScore extends Component {
  static propTypes = {
    next: PropTypes.func,
  };

  constructor (props) {
    super(props);
    this.state = {};
  }

  render () {
    renderLog('IntroNetworkScore');  // Set LOG_RENDER_EVENTS to log all renders
    return (
      <div
        className="intro-story__background background--image5"
        style={isCordova() ? { backgroundImage: 'url(./img/global/intro-story/slide5-flagpole-698x600.jpg)' } : null}
      >
        <div className="intro-story__h1">We Keep Score</div>
        <div className="intro-story__h2">
          <strong>Follow</strong>
          {' '}
          an organization
          <br />
          to add their opinions
          <br />
          to your
          {' '}
          <strong>We Vote</strong>
          {' '}
          network.
          <br />
          <br />
          A candidate&apos;s
          <br />
          <strong>Score in Your Network</strong>
          <br />
          shows support from friends and
          <br />
          the organizations you follow.
        </div>
        <div className="intro-story__padding-btn">
          <button type="button" className="btn btn-success btn-lg" onClick={this.props.next}>Next&nbsp;&nbsp;&gt;</button>
        </div>
      </div>
    );
  }
}
