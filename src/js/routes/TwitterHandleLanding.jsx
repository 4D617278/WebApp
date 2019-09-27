import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router';
import Helmet from 'react-helmet';
import Candidate from './Ballot/Candidate';
import LoadingWheel from '../components/LoadingWheel';
import { renderLog } from '../utils/logging';
import OrganizationVoterGuide from './VoterGuide/OrganizationVoterGuide';
import OrganizationActions from '../actions/OrganizationActions';
import PositionListForFriends from './VoterGuide/PositionListForFriends';
import TwitterActions from '../actions/TwitterActions';
import TwitterStore from '../stores/TwitterStore';
import UnknownTwitterAccount from './VoterGuide/UnknownTwitterAccount';
import VoterStore from '../stores/VoterStore';

export default class TwitterHandleLanding extends Component {
  static propTypes = {
    active_route: PropTypes.string,
    params: PropTypes.object,
    location: PropTypes.object.isRequired,
  };

  constructor (props) {
    super(props);
    this.state = {
      activeRoute: '',
      twitterHandle: '',
    };
  }

  componentDidMount () {
    // console.log("TwitterHandleLanding componentDidMount, this.props.params.twitter_handle: " + this.props.params.twitter_handle);
    this.setState({
      activeRoute: this.props.active_route,
      twitterHandle: this.props.params.twitter_handle,
    });
    TwitterActions.twitterIdentityRetrieve(this.props.params.twitter_handle);
    this.twitterStoreListener = TwitterStore.addListener(this.onTwitterStoreChange.bind(this));

    this.onVoterStoreChange();
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
  }

  componentWillReceiveProps (nextProps) {
    // console.log("TwitterHandleLanding componentWillReceiveProps");
    this.setState({
      activeRoute: nextProps.active_route,
    });
    if (nextProps.params.twitter_handle && this.state.twitterHandle.toLowerCase() !== nextProps.params.twitter_handle.toLowerCase()) {
      // We need this test to prevent an infinite loop
      // console.log("TwitterHandleLanding componentWillReceiveProps, different twitterHandle: ", nextProps.params.twitter_handle);
      TwitterActions.twitterIdentityRetrieve(nextProps.params.twitter_handle);
    }
  }

  componentWillUnmount () {
    this.twitterStoreListener.remove();
    this.voterStoreListener.remove();
  }

  onTwitterStoreChange () {
    // console.log("TwitterHandleLanding onTwitterStoreChange");
    let { twitter_followers_count: twitterFollowersCount } = TwitterStore.get();
    const {
      kind_of_owner: kindOfOwner, owner_we_vote_id: ownerWeVoteId, twitter_handle: twitterHandle,
      twitter_description: twitterDescription,  twitter_name: twitterName,
      twitter_photo_url: twitterPhotoUrl, twitter_user_website: twitterUserWebsite, status,
    } = TwitterStore.get();

    if (typeof twitterFollowersCount !== 'number') {
      twitterFollowersCount = 0;
    }

    this.setState({
      kindOfOwner,
      ownerWeVoteId,
      twitterHandle,
      twitterDescription,
      twitterFollowersCount,
      twitterName,
      twitterPhotoUrl,
      twitterUserWebsite,
      status,
    });
  }

  onVoterStoreChange () {
    // console.log("TwitterHandleLanding onTwitterStoreChange");
    this.setState({ voter: VoterStore.getVoter() });
  }

  organizationCreateFromTwitter (newTwitterHandle) {
    // console.log("TwitterHandleLanding organizationCreateFromTwitter");
    OrganizationActions.saveFromTwitter(newTwitterHandle);
  }

  render () {
    renderLog(__filename);
    if (this.state.status === undefined) {
      // console.log("TwitterHandleLanding this.state.status undefined");
      // Show a loading wheel while this component's data is loading
      return LoadingWheel;
    }

    const {
      activeRoute, voter, kindOfOwner, ownerWeVoteId, twitterHandle,
    } = this.state;
    const signedInTwitter = voter === undefined ? false : voter.signed_in_twitter;
    let signedInWithThisTwitterAccount = false;
    let lookingAtPositionsForFriendsOnly = false;
    if (signedInTwitter) {
      const twitterHandleBeingViewed = twitterHandle; // Variable copied for code clarity
      // That is, you are looking at yourself
      signedInWithThisTwitterAccount = voter.twitter_screen_name === twitterHandleBeingViewed;

      // If we want to give people a way to only see the positions that are only visible to their friends, this is how
      lookingAtPositionsForFriendsOnly = false;
    }

    // If signedInWithThisTwitterAccount AND not an ORGANIZATION or POLITICIAN, then create ORGANIZATION
    // We *may* eventually have a "VOTER" type, but for now ORGANIZATION is all we need for both orgs and voters
    const isNeitherOrganizationNorPolitician = kindOfOwner !== 'ORGANIZATION' && kindOfOwner !== 'POLITICIAN';
    if (signedInWithThisTwitterAccount && isNeitherOrganizationNorPolitician) {
      // We make the API call to create a new organization for this Twitter handle. This will create a cascade so that
      // js/routes/TwitterHandleLanding will switch the view to an Organization card / PositionList
      // console.log("TwitterHandleLanding, calling organizationCreateFromTwitter because isNeitherOrganizationNorPolitician");
      this.organizationCreateFromTwitter(voter.twitter_screen_name);
    }

    // } else if (signedInWithThisTwitterAccount && voter_not_linked_to_organization) {
    //   // We (TODO DALE *should*) link the voter record to the organization with Twitter sign in -- this is for safety
    //   // TODO DALE 2016-10-30 Moving this to Twitter sign in
    //   // console.log("TwitterHandleLanding, calling organizationCreateFromTwitter because voter_not_linked_to_organization");
    //   // this.organizationCreateFromTwitter(voter.twitter_screen_name);
    // }

    if (this.state.kindOfOwner === 'CANDIDATE') {
      this.props.params.candidate_we_vote_id = ownerWeVoteId;
      return <Candidate candidate_we_vote_id {...this.props} />;
    } else if (this.state.kindOfOwner === 'ORGANIZATION') {
      this.props.params.organization_we_vote_id = ownerWeVoteId;
      if (lookingAtPositionsForFriendsOnly) {
        return <PositionListForFriends {...this.props} />;
      } else {
        return (
          <OrganizationVoterGuide
            {...this.props}
            location={this.props.location}
            params={this.props.params}
            active_route={activeRoute}
          />
        );
      }
    } else if (this.state.kindOfOwner === 'TWITTER_HANDLE_NOT_FOUND_IN_WE_VOTE') {
      // console.log("TwitterHandleLanding TWITTER_HANDLE_NOT_FOUND_IN_WE_VOTE calling UnknownTwitterAccount");
      return <UnknownTwitterAccount {...this.state} />;
    } else {
      // console.log("render in TwitterHandleLanding  else, this.state.kindOfOwner");
      return (
        <div className="container-fluid well u-stack--md u-inset--md">
          <Helmet title="Not Found - We Vote" />
          <h3 className="h3">Claim Your Page</h3>
          <div className="medium">
            We were not able to find an account for this
            Twitter Handle
            { this.state.twitterHandle ? (
              <span>
                {' '}
                &quot;
                {this.state.twitterHandle}
                &quot;
              </span>
            ) :
              <span />
            }
            .
          </div>
          <br />
          <Link
            id="TwitterHandleLandingSignIntoTwitterToCreateVoterGuideButton"
            to="/twittersigninprocess/signinswitchstart"
          >
            <Button
              color="primary"
              variant="contained"
            >
              Sign Into Twitter to Create Voter Guide
            </Button>
          </Link>
          <br />
          <br />
          <br />
        </div>
      );
    }
  }
}
