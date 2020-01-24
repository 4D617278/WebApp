import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import Slider from 'react-slick';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { withStyles, withTheme } from '@material-ui/core/styles';
import closeIcon from '../../../img/global/icons/x-close.png';
import { cordovaFooterHeight, cordovaNetworkNextButtonTop } from '../../utils/cordovaOffsets';
import { cordovaDot, getAndroidSize, historyPush, isAndroid, isWebApp } from '../../utils/cordovaUtils';
import FriendInvitationOnboardingIntro from '../../components/Intro/FriendInvitationOnboardingIntro';
import { renderLog } from '../../utils/logging';


class FriendInvitationOnboarding extends Component {
  static goToBallotLink () {
    const ballotLink = '/ballot';
    historyPush(ballotLink);
  }

  static propTypes = {
    classes: PropTypes.object,
  };

  constructor (props) {
    super(props);
    this.state = {};

    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.slider = React.createRef();
  }

  componentWillMount () {
    document.body.style.backgroundColor = '#A3A3A3';
    document.body.className = 'story-view';
  }

  componentWillUnmount () {
    document.body.style.backgroundColor = null;
    document.body.className = '';
  }

  next () {
    this.slider.current.slickNext();
  }

  previous () {
    this.slider.current.slickPrev();
  }

  overrideMediaQueryForAndroidTablets () {
    // Media queries in CSS often don't work as expected in Cordova, due to window.devicePixelRatio greater than one
    if (isAndroid()) {
      const sizeString = getAndroidSize();
      if (sizeString === '--xl') {
        return {
          maxHeight: 'unset',
          maxWidth: 'unset',
        };
      }
    }
    return {};
  }

  render () {
    renderLog('FriendInvitationOnboarding');  // Set LOG_RENDER_EVENTS to log all renders
    const { classes } = this.props;

    // These are settings for the react-slick slider
    const settings = {
      dots: false,
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      swipe: true,
      accessibility: true,
      arrows: false,
    };

    return (
      <div>
        <Helmet title="Welcome to We Vote" />
        <div className="intro-story container-fluid well u-inset--md" style={this.overrideMediaQueryForAndroidTablets()}>
          <span onClick={FriendInvitationOnboarding.goToBallotLink}>
            <img
              src={cordovaDot(closeIcon)}
              className={isWebApp() ? 'x-close' : 'x-close x-close__cordova'}
              alt="close"
            />
          </span>
          <Slider {...settings} dotsClass="slick-dots intro-modal__gray-dots" ref={this.slider}>
            <div key={1}><FriendInvitationOnboardingIntro next={this.next} /></div>
            <div key={2}><FriendInvitationOnboardingIntro next={this.next} /></div>
            <div key={3}><FriendInvitationOnboardingIntro next={this.next} /></div>
          </Slider>
          <FooterBarWrapper style={{ height: `${cordovaFooterHeight()}` }}>
            <TwoButtonsWrapper>
              <BackButtonWrapper>
                <Button
                  classes={{ root: classes.nextButtonRoot }}
                  color="primary"
                  // disabled={selectedStepIndex === 0}
                  fullWidth
                  id="voterGuideSettingsPositionsSeeFullBallot"
                  onClick={this.previous}
                  style={{ top: `${cordovaNetworkNextButtonTop()}` }}
                  variant="outlined"
                >
                  Back
                </Button>
              </BackButtonWrapper>
              <NextButtonWrapper>
                <Button
                  color="primary"
                  id="howItWorksNext"
                  variant="contained"
                  classes={{ root: classes.nextButtonRoot }}
                  onClick={this.next}
                >
                  Next
                </Button>
              </NextButtonWrapper>
            </TwoButtonsWrapper>
          </FooterBarWrapper>
        </div>
      </div>
    );
  }
}

const styles = theme => ({
  buttonRoot: {
    fontSize: 12,
    padding: '4px 8px',
    height: 32,
    width: '100%',
    [theme.breakpoints.down('md')]: {
    },
    [theme.breakpoints.down('sm')]: {
      padding: '4px 4px',
    },
  },
  buttonOutlinedPrimary: {
    background: 'white',
  },
  nextButtonRoot: {
    width: '100%',
  },
});

const FooterBarWrapper = styled.div`
  background: #fff;
  border-top: 1px solid #eee;
  bottom: 0;
  box-shadow: 0 -4px 4px -1px rgba(0, 0, 0, .2), 0 -4px 5px 0 rgba(0, 0, 0, .14), 0 -1px 10px 0 rgba(0, 0, 0, .12);
  max-width: 750px;
  padding-bottom: env(safe-area-inset-bottom);
  position: fixed;
  width: 100%;
  @media print{
    display: none;
  }
`;

const TwoButtonsWrapper = styled.div`
  width: 100%;
  padding: 12px 8px 12px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackButtonWrapper = styled.div`
  padding-right: 12px;
  width: 100%;
  @media(min-width: 520px) {
    padding-right: 12px;
  }
`;

const NextButtonWrapper = styled.div`
  width: 100%;
`;


export default withTheme(withStyles(styles)(FriendInvitationOnboarding));
