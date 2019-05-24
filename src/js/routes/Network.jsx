import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Helmet from 'react-helmet';
import AnalyticsActions from '../actions/AnalyticsActions';
import BrowserPushMessage from '../components/Widgets/BrowserPushMessage';
import FriendActions from '../actions/FriendActions';
import FriendStore from '../stores/FriendStore';
import LoadingWheel from '../components/LoadingWheel';
import { renderLog } from '../utils/logging';
import NetworkFriendRequests from '../components/Network/NetworkFriendRequests';
import NetworkFriends from '../components/Network/NetworkFriends';
import NetworkIssuesFollowed from '../components/Network/NetworkIssuesFollowed';
import NetworkOpinions from '../components/Network/NetworkOpinions';
import NetworkOpinionsFollowed from '../components/Network/NetworkOpinionsFollowed';
import TwitterSignIn from '../components/Twitter/TwitterSignIn';
import VoterStore from '../stores/VoterStore';
import ReadMore from '../components/Widgets/ReadMore';

const twitterInfoText = 'Signing into Twitter is the fastest way to find voter guides related to your values and the issues you care about. When you sign into Twitter, We Vote will find the voter guides for everyone you are following.';

// const facebookInfoText = "By signing into Facebook here, you can choose which friends you want to talk politics with, and avoid the trolls (or that guy from work who rambles on)! You control who is in your We Vote network.";

const EmailInfoText = 'Send email invitations to your friends. Share your vision, and get help from your friends as you make decisions about how to vote.';

export default class Network extends Component {
  static propTypes = {
    location: PropTypes.object,
    params: PropTypes.object,
  };

  constructor (props) {
    super(props);
    this.state = {
      editMode: '',
      friendInvitationsSentToMe: [],
      suggestedFriendList: [],
    };
  }

  componentDidMount () {
    FriendActions.currentFriends();
    FriendActions.friendInvitationsSentByMe();
    FriendActions.friendInvitationsSentToMe();
    FriendActions.friendInvitationsProcessed();
    FriendActions.suggestedFriendList();
    this.onFriendStoreChange();
    this.onVoterStoreChange();
    this.friendStoreListener = FriendStore.addListener(this.onFriendStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    this.setState({ pathname: this.props.location.pathname });
    AnalyticsActions.saveActionNetwork(VoterStore.electionId());
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.friendInvitationsSentToMe.length > 0) { // has invitations
      if (nextProps.location.pathname === '/more/network' || !nextProps.params.edit_mode) {
        this.setState({ editMode: 'friends' });
      } else {
        this.setState({ editMode: nextProps.params.edit_mode });
      }
    } else if (this.state.suggestedFriendList.length > 0) { // has suggested friends
      if (nextProps.location.pathname === '/more/network' || !nextProps.params.edit_mode) {
        this.setState({ editMode: 'friends' });
      } else {
        this.setState({ editMode: nextProps.params.edit_mode });
      }
    } else {
      this.setState({ editMode: nextProps.params.edit_mode });
    }
  }

  componentWillUnmount () {
    this.friendStoreListener.remove();
    this.voterStoreListener.remove();
  }

  onFriendStoreChange () {
    const newState = {
      friendInvitationsSentToMe: FriendStore.friendInvitationsSentToMe(),
      suggestedFriendList: FriendStore.suggestedFriendList(),
    };

    if (newState.friendInvitationsSentToMe.length > 0) { // has invitations
      if (this.state.pathname === '/more/network') {
        newState.editMode = 'friends';
      } else {
        newState.editMode = this.props.params.edit_mode || 'friends';
      }
    } else {
      newState.editMode = this.props.params.edit_mode || 'organizations';
    }

    this.setState(newState);
  }

  onVoterStoreChange () {
    this.setState({ voter: VoterStore.getVoter() });
  }

  render () {
    renderLog(__filename);
    if (!this.state.voter) {
      return LoadingWheel;
    }

    let networkComponentToDisplay = null;
    switch (this.state.editMode) {
      default:
      case 'organizations':
        networkComponentToDisplay = <NetworkOpinions />;
        break;
      case 'friends':
        networkComponentToDisplay = <NetworkFriendRequests />;
        break;
    }

    return (
      <span>
        <Helmet title="Your Network - We Vote" />
        <BrowserPushMessage incomingProps={this.props} />
        <section className="card network__card">
          <div className="card-main">
            <h3 className="h3 text-center">Build Your We Vote Network</h3>

            {/* Desktop view */}
            <div className="d-none d-sm-block buttons-container">
              { this.state.voter.signed_in_twitter ?
                null : (
                  <div className="network-btn">
                    <TwitterSignIn className="btn btn-social btn-lg btn-twitter text-center" buttonText="Find Voter Guides" />
                    <ReadMore
                      className="social-btn-description"
                      text_to_display={twitterInfoText}
                      num_of_lines={2}
                    />
                  </div>
                )
              }
              {/* Commented out since choose Friends via Facebook is currently broken */}
              {/* <div className="network-btn">
              <Link to="/facebook_invitable_friends" className="btn btn-social btn-lg btn-facebook text-center">
                <i className="fab fa-facebook"/>Choose Friends
              </Link>
              <ReadMore
                className="social-btn-description"
                text_to_display={facebookInfoText}
                num_of_lines={2}
              />
            </div> */}
              <div className="network-btn">
                <Link to="/friends/invitebyemail" className="btn btn-social btn-lg btn--email text-center">
                  <i className="fas fa-envelope" />
                  Invite Friends
                </Link>
                <ReadMore
                  className="social-btn-description"
                  text_to_display={EmailInfoText}
                  num_of_lines={2}
                />
              </div>
            </div>

            {/* Mobile view */}
            <div className="d-flex d-sm-none mobile-container">
              { this.state.voter.signed_in_twitter ?
                null : (
                  <div className="network-btn">
                    <TwitterSignIn buttonText="Find" className="btn btn-social btn-md btn-twitter" />
                  </div>
                )
              }
              {/* Commented out since choose Friends via Facebook is currently broken */}
              {/* <div className="network-btn">
                <Link to="/facebook_invitable_friends" className="btn btn-social btn-md btn-facebook">
                 <i className="fab fa-facebook"/>Choose
                </Link>
              </div> */}
              <div className="network-btn">
                <Link to="/friends/invitebyemail" className="btn btn-social btn-md btn--email">
                  <i className="fas fa-envelope" />
                  Invite
                </Link>
              </div>
            </div>
          </div>
        </section>
        <div className="row">
          <div className="col-sm-12 col-md-8">
            <div className="tabs__tabs-container-wrap">
              <div className="tabs__tabs-container d-print-none">
                <ul className="nav tabs__tabs">
                  <li className="tab-item">
                    <Link to={{ pathname: '/more/network/friends' }} className={this.state.editMode === 'friends' ? 'tab tab-active' : 'tab tab-default'}>
                      <span className="d-block d-sm-none">Requests</span>
                      <span className="d-none d-sm-block">Friend Requests</span>
                    </Link>
                  </li>
                  <li className="tab-item">
                    <Link to="/more/network/organizations" className={this.state.editMode === 'organizations' ? 'tab tab-active' : 'tab tab-default'}>
                      <span className="d-block d-sm-none">Organizations</span>
                      <span className="d-none d-sm-block">Follow Organizations</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            {networkComponentToDisplay}
          </div>

          <div className="col-md-4 d-none d-sm-block">
            <NetworkOpinionsFollowed />
            <NetworkFriends />
            <NetworkIssuesFollowed />
          </div>
        </div>
      </span>
    );
  }
}
