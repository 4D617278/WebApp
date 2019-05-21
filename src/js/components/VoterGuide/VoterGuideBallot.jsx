import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Helmet from 'react-helmet';
import moment from 'moment';
import Badge from '@material-ui/core/Badge';
import Chip from '@material-ui/core/Chip';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import { withStyles } from '@material-ui/core/styles';
import AddressBox from '../AddressBox';
import AnalyticsActions from '../../actions/AnalyticsActions';
import BallotActions from '../../actions/BallotActions';
import BallotElectionList from '../Ballot/BallotElectionList';
import BallotItemCompressed from '../Ballot/BallotItemCompressed';
import BallotIntroModal from '../Ballot/BallotIntroModal';
import BallotStatusMessage from '../Ballot/BallotStatusMessage';
import BallotStore from '../../stores/BallotStore';
import BallotSummaryModal from '../Ballot/BallotSummaryModal';
import BallotSearch from '../Ballot/BallotSearch';
import BrowserPushMessage from '../Widgets/BrowserPushMessage';
import cookies from '../../utils/cookies';
import {
  historyPush, isCordova, isWebApp,
} from '../../utils/cordovaUtils';
import ElectionActions from '../../actions/ElectionActions';
import ElectionStore from '../../stores/ElectionStore';
import isMobile from '../../utils/isMobile';
import OpenExternalWebSite from '../Widgets/OpenExternalWebSite';
import OrganizationActions from '../../actions/OrganizationActions';
import OrganizationStore from '../../stores/OrganizationStore';
import PledgeToSupportOrganizationButton from './PledgeToSupportOrganizationButton';
import PledgeToSupportOrganizationStatusBar from './PledgeToSupportOrganizationStatusBar';
import { renderLog } from '../../utils/logging';
import SelectBallotModal from '../Ballot/SelectBallotModal';
import SupportActions from '../../actions/SupportActions';
import SupportStore from '../../stores/SupportStore';
import VoterGuideActions from '../../actions/VoterGuideActions';
import VoterGuideBallotItemCompressed from './VoterGuideBallotItemCompressed';
import VoterGuideStore from '../../stores/VoterGuideStore';
import VoterStore from '../../stores/VoterStore';
import AppStore from '../../stores/AppStore';
import { calculateBallotBaseUrl } from '../../utils/textFormat';
import { showToastSuccess } from '../../utils/showToast';
import webAppConfig from '../../config';
import AppActions from '../../actions/AppActions';

// December 2018:  We want to work toward being airbnb style compliant, but for now these are disabled in this file to minimize massive changes
/* eslint no-param-reassign: 1 */
/* eslint jsx-a11y/no-noninteractive-element-to-interactive-role: 1 */

// Related to WebApp/src/js/routes/Ballot/Ballot.jsx

const BALLOT_ITEM_FILTER_TYPES = ['Federal', 'State', 'Measure', 'Local'];

const styles = theme => ({
  badge: {
    top: 13,
    minWidth: 16,
    width: 20,
    right: 14,
    background: 'rgba(46, 60, 93, 0.08)',
    color: '#333',
    [theme.breakpoints.down('md')]: {
      fontSize: 9,
      width: 16,
      height: 16,
      top: 11,
      right: 11,
    },
  },
  badgeColorPrimary: {
    background: theme.palette.primary.main,
    color: 'white',
  },
  chipRoot: {
    height: 26,
    [theme.breakpoints.down('md')]: {
      height: 22.5,
    },
  },
  iconRoot: {
    position: 'absolute',
    left: 3,
    top: 1,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    [theme.breakpoints.down('md')]: {
      fontSize: 16,
      top: 3,
    },
  },
});

class VoterGuideBallot extends Component {
  static propTypes = {
    active_route: PropTypes.string,
    location: PropTypes.object,
    organization: PropTypes.object.isRequired,
    params: PropTypes.object,
  };

  constructor (props) {
    super(props);
    this.state = {
      ballotElectionList: [],
      ballotItemUnfurledTracker: {},
      ballotLength: 0,
      ballotRemainingChoicesLength: 0,
      ballotWithAllItems: [],
      ballotWithItemsFromCompletionFilterType: [],
      foundFirstRaceLevel: false,
      raceLevelFilterType: '',
      ballotReturnedWeVoteId: '',
      ballotLocationShortcut: '',
      candidateForModal: {
        voter_guides_to_follow_for_latest_ballot_item: [],
        position_list: [],
      },
      componentDidMountFinished: false,
      hideIntroModalFromUrl: 0,
      hideIntroModalFromCookie: 0,
      lastHashUsedInLinkScroll: '',
      measureForModal: {
        voter_guides_to_follow_for_latest_ballot_item: [],
        position_list: [],
      },
      mounted: false,
      organization: {},
      showBallotIntroModal: false,
      showSelectBallotModal: false,
      showBallotSummaryModal: false,
      voterBallotList: [],
      voterGuideOnStage: undefined,
      showFilterTabs: false,
      isSearching: false,
      ballotSearchResults: [],
    };

    this.ballotItems = {};
    this.ballotItemLinkHasBeenClicked = this.ballotItemLinkHasBeenClicked.bind(this);
    this.toggleBallotIntroModal = this.toggleBallotIntroModal.bind(this);
    this.ballotItemsCompressedReference = {};
    this.pledgeToVoteWithVoterGuide = this.pledgeToVoteWithVoterGuide.bind(this);
    this.toggleBallotSummaryModal = this.toggleBallotSummaryModal.bind(this);
    this.toggleSelectBallotModal = this.toggleSelectBallotModal.bind(this);
    this.updateOfficeDisplayUnfurledTracker = this.updateOfficeDisplayUnfurledTracker.bind(this);
  }

  componentDidMount () {
    const ballotBaseUrl = calculateBallotBaseUrl(null, this.props.location.pathname);
    // console.log("VoterGuideBallot componentDidMount, ballotBaseUrl", ballotBaseUrl);

    const hideIntroModalFromUrl = this.props.location.query ? this.props.location.query.hide_intro_modal : 0;
    const hideIntroModalFromCookie = cookies.getItem('hide_intro_modal') || 0;
    const waitUntilVoterSignInCompletes = this.props.location.query ? this.props.location.query.wait_until_voter_sign_in_completes : 0;

    if (waitUntilVoterSignInCompletes !== undefined ||
        hideIntroModalFromCookie ||
        hideIntroModalFromUrl) {
      this.setState({
        componentDidMountFinished: true,
        mounted: true,
        showBallotIntroModal: false,
      });
    } else {
      // hide_intro_modal is the default now
      // showBallotIntroModal: !VoterStore.getInterfaceFlagState(VoterConstants.BALLOT_INTRO_MODAL_SHOWN),
      this.setState({
        componentDidMountFinished: true,
        mounted: true,
        showBallotIntroModal: false,
      });
    }

    const completionLevelFilterType = BallotStore.getCompletionLevelFilterTypeSaved() || 'all';
    const ballotWithItemsFromCompletionFilterType = BallotStore.getBallotByCompletionLevelFilterType(completionLevelFilterType);
    if (ballotWithItemsFromCompletionFilterType !== undefined) {
      // console.log("ballotWithItemsFromCompletionFilterType !== undefined");
      if (completionLevelFilterType === 'all') {
        this.setState({
          ballotWithAllItems: ballotWithItemsFromCompletionFilterType,
          ballotWithItemsFromCompletionFilterType,
        });
      } else {
        const ballotWithAllItems = BallotStore.getBallotByCompletionLevelFilterType('all');
        this.setState({
          ballotWithAllItems,
          ballotWithItemsFromCompletionFilterType,
        });
      }
    }

    let googleCivicElectionIdFromUrl = this.props.params.google_civic_election_id || 0;

    // console.log("googleCivicElectionIdFromUrl: ", googleCivicElectionIdFromUrl);
    let ballotReturnedWeVoteId = this.props.params.ballot_returned_we_vote_id || '';
    ballotReturnedWeVoteId = ballotReturnedWeVoteId === 'none' ? '' : ballotReturnedWeVoteId;

    // console.log("this.props.params.ballot_returned_we_vote_id: ", this.props.params.ballot_returned_we_vote_id);
    let ballotLocationShortcut = this.props.params.ballot_location_shortcut || '';
    ballotLocationShortcut = ballotLocationShortcut.trim();
    ballotLocationShortcut = ballotLocationShortcut === 'none' ? '' : ballotLocationShortcut;
    let googleCivicElectionId = 0;

    // console.log("componentDidMount, BallotStore.ballotProperties: ", BallotStore.ballotProperties);
    if (googleCivicElectionIdFromUrl !== 0) {
      googleCivicElectionIdFromUrl = parseInt(googleCivicElectionIdFromUrl, 10);

      // googleCivicElectionId = googleCivicElectionIdFromUrl;
    } else if (BallotStore.ballotProperties && BallotStore.ballotProperties.google_civic_election_id) {
      googleCivicElectionId = BallotStore.ballotProperties.google_civic_election_id;
    }

    // console.log("ballotReturnedWeVoteId: ", ballotReturnedWeVoteId, ", ballotLocationShortcut:", ballotLocationShortcut, ", googleCivicElectionIdFromUrl: ", googleCivicElectionIdFromUrl);
    if (ballotReturnedWeVoteId || ballotLocationShortcut || googleCivicElectionIdFromUrl) {
      if (ballotLocationShortcut !== '') {
        // Change the ballot on load to make sure we are getting what we expect from the url
        BallotActions.voterBallotItemsRetrieve(0, '', ballotLocationShortcut);

        // Change the URL to match
        historyPush(`${ballotBaseUrl}/${ballotLocationShortcut}`);
      } else if (ballotReturnedWeVoteId !== '') {
        // Change the ballot on load to make sure we are getting what we expect from the url
        BallotActions.voterBallotItemsRetrieve(0, ballotReturnedWeVoteId, '');

        // Change the URL to match
        historyPush(`${ballotBaseUrl}/id/${ballotReturnedWeVoteId}`);
      } else if (googleCivicElectionIdFromUrl !== 0) {
        // Change the ballot on load to make sure we are getting what we expect from the url
        if (googleCivicElectionId !== googleCivicElectionIdFromUrl) {
          BallotActions.voterBallotItemsRetrieve(googleCivicElectionIdFromUrl, '', '');

          // Change the URL to match
          let ballotElectionUrl = `${ballotBaseUrl}/election/${googleCivicElectionIdFromUrl}`;
          if (this.props.active_route && this.props.active_route !== '') {
            ballotElectionUrl += `/${this.props.active_route}`;
          }
          historyPush(ballotElectionUrl);
        }

        // No change to the URL needed
        // Now set googleCivicElectionId
        googleCivicElectionId = googleCivicElectionIdFromUrl;
      } else if (googleCivicElectionId !== 0) {
        // No need to retrieve data again
        // Change the URL to match the current googleCivicElectionId
        let ballotElectionUrl2 = `${ballotBaseUrl}/election/${googleCivicElectionId}`;
        if (this.props.active_route && this.props.active_route !== '') {
          ballotElectionUrl2 += `/${this.props.active_route}`;
        }
        historyPush(ballotElectionUrl2);
      }
    // DALE NOTE 2018-1-18 Commented this out because it will take voter away from voter guide. Needs further testing.
    // else if (BallotStore.ballotProperties && BallotStore.ballotProperties.ballot_found === false){ // No ballot found
    //   // console.log("if (BallotStore.ballotProperties && BallotStore.ballotProperties.ballot_found === false");
    //   historyPush("/settings/location");
    } else if (ballotWithItemsFromCompletionFilterType === undefined) {
      // console.log("WebApp doesn't know the election or have ballot data, so ask the API server to return best guess");
      BallotActions.voterBallotItemsRetrieve(0, '', '');
    }

    // We need a ballotStoreListener here because we want the ballot to display before positions are received
    this.ballotStoreListener = BallotStore.addListener(this.onBallotStoreChange.bind(this));
    // NOTE: voterAllPositionsRetrieve and positionsCountForAllBallotItems are also called in SupportStore when voterAddressRetrieve is received,
    // so we get duplicate calls when you come straight to the Ballot page. There is no easy way around this currently.
    SupportActions.voterAllPositionsRetrieve();

    // June 2018: Avoid hitting this same api multiple times, if we already have the data
    if (!SupportStore.isSupportAlreadyInCache()) {
      SupportActions.positionsCountForAllBallotItems(googleCivicElectionId);
    }

    BallotActions.voterBallotListRetrieve(); // Retrieve a list of ballots for the voter from other elections
    this.organizationStoreListener = OrganizationStore.addListener(this.onOrganizationStoreChange.bind(this));
    this.voterGuideStoreListener = VoterGuideStore.addListener(this.onVoterGuideStoreChange.bind(this));
    this.supportStoreListener = SupportStore.addListener(this.onSupportStoreChange.bind(this));
    this.onVoterStoreChange();
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    this.appStoreListener = AppStore.addListener(this.onAppStoreChange.bind(this));

    // Once a voter hits the ballot, they have gone through orientation
    cookies.setItem('ballot_has_been_visited', '1', Infinity, '/');
    cookies.setItem('show_full_navigation', '1', Infinity, '/');

    this.electionListListener = ElectionStore.addListener(this.onElectionStoreChange.bind(this));
    ElectionActions.electionsRetrieve();
    OrganizationActions.organizationsFollowedRetrieve();

    if (googleCivicElectionId && googleCivicElectionId !== 0) {
      AnalyticsActions.saveActionBallotVisit(googleCivicElectionId);
    } else {
      AnalyticsActions.saveActionBallotVisit(VoterStore.electionId());
    }

    const { location } = this.props;
    const { pathname } = location;
    this.setState({
      ballotElectionList: BallotStore.ballotElectionList(),
      completionLevelFilterType,
      ballotReturnedWeVoteId,
      ballotLocationShortcut,
      googleCivicElectionId: parseInt(googleCivicElectionId, 10),
      hideIntroModalFromUrl,
      hideIntroModalFromCookie,
      location,
      organization: this.props.organization,
      pathname,
      raceLevelFilterType: BallotStore.getRaceLevelFilterTypeSaved() || 'Federal',
      voterGuideOnStage: VoterGuideStore.getVoterGuideForOrganizationIdAndElection(this.props.organization.organization_we_vote_id, VoterStore.electionId()),
      waitUntilVoterSignInCompletes,
    });

    const { hash } = location;
    if (location && hash) {
      // this.hashLinkScroll();
      this.setState({ lastHashUsedInLinkScroll: hash });
    }
  }

  componentWillReceiveProps (nextProps) {
    // console.log("VoterGuideBallot componentWillReceiveProps, nextProps: ", nextProps);

    // We don't want to let the googleCivicElectionId disappear
    const googleCivicElectionId = nextProps.params.google_civic_election_id || this.state.googleCivicElectionId;
    let ballotReturnedWeVoteId = nextProps.params.ballot_returned_we_vote_id || '';
    ballotReturnedWeVoteId = ballotReturnedWeVoteId.trim();
    let ballotLocationShortcut = nextProps.params.ballot_location_shortcut || '';
    ballotLocationShortcut = ballotLocationShortcut.trim();
    const completionLevelFilterType = BallotStore.getCompletionLevelFilterTypeSaved() || 'all';

    // Were there any actual changes?
    if (ballotReturnedWeVoteId !== this.state.ballotReturnedWeVoteId ||
        ballotLocationShortcut !== this.state.ballotLocationShortcut ||
        googleCivicElectionId !== this.state.googleCivicElectionId ||
        completionLevelFilterType !== this.state.completionLevelFilterType) {
      this.setState({
        ballotWithAllItems: BallotStore.getBallotByCompletionLevelFilterType('all'),
        ballotWithItemsFromCompletionFilterType: BallotStore.getBallotByCompletionLevelFilterType(completionLevelFilterType),
        ballotReturnedWeVoteId,
        ballotLocationShortcut,
        completionLevelFilterType,
        googleCivicElectionId: parseInt(googleCivicElectionId, 10),
        location: nextProps.location,
        organization: nextProps.organization,
        pathname: nextProps.location.pathname,
        voterGuideOnStage: VoterGuideStore.getVoterGuideForOrganizationIdAndElection(nextProps.organization.organization_we_vote_id, VoterStore.electionId()),
      });

      // if (googleCivicElectionId && googleCivicElectionId !== 0) {
      //   AnalyticsActions.saveActionBallotVisit(googleCivicElectionId);
      // } else {
      //   AnalyticsActions.saveActionBallotVisit(VoterStore.electionId());
      // }
    } else {
      this.setState({
        organization: OrganizationStore.getOrganizationByWeVoteId(nextProps.organization.organization_we_vote_id),
        voterGuideOnStage: VoterGuideStore.getVoterGuideForOrganizationIdAndElection(nextProps.organization.organization_we_vote_id, VoterStore.electionId()),
      });
    }

    if (nextProps.location && nextProps.location.hash) {
      // this.hashLinkScroll();
      this.setState({ lastHashUsedInLinkScroll: nextProps.location.hash });
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    // This lifecycle method tells the component to NOT render if componentWillReceiveProps didn't see any changes
    if (this.state.componentDidMountFinished === false) {
      // console.log("shouldComponentUpdate: componentDidMountFinished === false");
      return true;
    }
    if (this.state.raceLevelFilterType !== nextState.raceLevelFilterType) {
      // console.log("shouldComponentUpdate: this.state.raceLevelFilterType", this.state.raceLevelFilterType, ", nextState.raceLevelFilterType", nextState.raceLevelFilterType);
      return true;
    }
    if (this.state.ballotItemUnfurledTracker !== nextState.ballotItemUnfurledTracker) {
      // console.log("shouldComponentUpdate: this.state.ballotItemUnfurledTracker", this.state.ballotItemUnfurledTracker, ", nextState.ballotItemUnfurledTracker", nextState.ballotItemUnfurledTracker);
      return true;
    }
    if (this.state.ballotLength !== nextState.ballotLength) {
      // console.log("shouldComponentUpdate: this.state.ballotLength", this.state.ballotLength, ", nextState.ballotLength", nextState.ballotLength);
      return true;
    }
    if (this.state.ballotRemainingChoicesLength !== nextState.ballotRemainingChoicesLength) {
      // console.log("shouldComponentUpdate: this.state.ballotRemainingChoicesLength", this.state.ballotRemainingChoicesLength, ", nextState.ballotRemainingChoicesLength", nextState.ballotRemainingChoicesLength);
      return true;
    }
    if (this.state.ballotLocationShortcut !== nextState.ballotLocationShortcut) {
      // console.log("shouldComponentUpdate: this.state.ballotLocationShortcut", this.state.ballotLocationShortcut, ", nextState.ballotLocationShortcut", nextState.ballotLocationShortcut);
      return true;
    }
    if (this.state.ballotReturnedWeVoteId !== nextState.ballotReturnedWeVoteId) {
      // console.log("shouldComponentUpdate: this.state.ballotReturnedWeVoteId", this.state.ballotReturnedWeVoteId, ", nextState.ballotReturnedWeVoteId", nextState.ballotReturnedWeVoteId);
      return true;
    }
    if (this.state.completionLevelFilterType !== nextState.completionLevelFilterType) {
      // console.log("shouldComponentUpdate: this.state.completionLevelFilterType", this.state.completionLevelFilterType, ", nextState.completionLevelFilterType", nextState.completionLevelFilterType);
      return true;
    }
    if (this.state.googleCivicElectionId !== nextState.googleCivicElectionId) {
      // console.log("shouldComponentUpdate: this.state.googleCivicElectionId", this.state.googleCivicElectionId, ", nextState.googleCivicElectionId", nextState.googleCivicElectionId);
      return true;
    }
    if (this.state.lastHashUsedInLinkScroll !== nextState.lastHashUsedInLinkScroll) {
      // console.log("shouldComponentUpdate: this.state.lastHashUsedInLinkScroll", this.state.lastHashUsedInLinkScroll, ", nextState.lastHashUsedInLinkScroll", nextState.lastHashUsedInLinkScroll);
      return true;
    }
    if (this.state.location !== nextState.location) {
      // console.log("shouldComponentUpdate: this.state.location", this.state.location, ", nextState.location", nextState.location);
      return true;
    }
    if (this.state.pathname !== nextState.pathname) {
      // console.log("shouldComponentUpdate: this.state.pathname", this.state.pathname, ", nextState.pathname", nextState.pathname);
      return true;
    }
    if (this.state.showBallotIntroModal !== nextState.showBallotIntroModal) {
      // console.log("shouldComponentUpdate: this.state.showBallotIntroModal", this.state.showBallotIntroModal, ", nextState.showBallotIntroModal", nextState.showBallotIntroModal);
      return true;
    }
    if (this.state.showBallotSummaryModal !== nextState.showBallotSummaryModal) {
      // console.log("shouldComponentUpdate: this.state.showBallotSummaryModal", this.state.showBallotSummaryModal, ", nextState.showBallotSummaryModal", nextState.showBallotSummaryModal);
      return true;
    }
    if (this.state.showSelectBallotModal !== nextState.showSelectBallotModal) {
      // console.log("shouldComponentUpdate: this.state.showSelectBallotModal", this.state.showSelectBallotModal, ", nextState.showSelectBallotModal", nextState.showSelectBallotModal);
      return true;
    }
    if (this.state.isSearching !== nextState.isSearching) {
      return true;
    }
    if (this.state.ballotSearchResults !== nextState.ballotSearchResults) {
      return true;
    }

    return false;
  }

  componentDidUpdate (prevProps, prevState) {
    const { foundFirstRaceLevel } = this.state;
    let { raceLevelFilterType } = this.state;
    if (!raceLevelFilterType) {
      raceLevelFilterType = ''; // Make sure this is a string
    }
    if (this.state.lastHashUsedInLinkScroll && this.state.lastHashUsedInLinkScroll !== prevState.lastHashUsedInLinkScroll) {
      this.hashLinkScroll();
    }
    // If we haven't found our default race level, run this check
    if (this.state.ballotWithAllItems && this.state.ballotWithAllItems.length && !foundFirstRaceLevel) {
      const { ballotWithAllItems } = this.state;
      const raceLevelFilterItems = ballotWithAllItems.filter(item => item.race_office_level === raceLevelFilterType ||
        item.kind_of_ballot_item === raceLevelFilterType.toUpperCase());
      // If there are items mapped to the current race level filter, set foundFirstRaceLevel to true
      // so we don't have to re-run this check
      if (raceLevelFilterItems.length) {
        this.setState({
          foundFirstRaceLevel: true,
          showFilterTabs: raceLevelFilterItems.length !== ballotWithAllItems.length,
        });
      } else {
        // If there are no items mapped to the current race level filter, set the raceLevelFilterType
        // to the next item in BALLOT_ITEM_FILTER_TYPES
        const raceLevelIdx = BALLOT_ITEM_FILTER_TYPES.indexOf(raceLevelFilterType);
        // console.log('componentDidUpdate raceLevelFilterType:', raceLevelFilterType, ', raceLevelIdx: ', raceLevelIdx);
        if (raceLevelIdx >= 0) {
          this.setState({ raceLevelFilterType: BALLOT_ITEM_FILTER_TYPES[raceLevelIdx + 1] });
        } else {
          // If the raceLevelFilterType is not a valid type, turn off the tabs and set foundFirstRaceLevel to stop cycling through
          this.setState({
            foundFirstRaceLevel: true,
            showFilterTabs: false,
          });
        }
      }
    }
  }

  componentWillUnmount () {
    // console.log("VoterGuideBallot componentWillUnmount");
    this.setState({
      mounted: false,
    });

    this.ballotStoreListener.remove();
    this.electionListListener.remove();
    this.organizationStoreListener.remove();
    this.supportStoreListener.remove();
    this.voterGuideStoreListener.remove();
    this.voterStoreListener.remove();
    this.appStoreListener.remove();
  }

  // See https://reactjs.org/docs/error-boundaries.html
  static getDerivedStateFromError (error) { // eslint-disable-line no-unused-vars
    // Update state so the next render will show the fallback UI, We should have a "Oh snap" page
    return { hasError: true };
  }

  onAppStoreChange () {
    this.setState({
      // ballotHeaderUnpinned: AppStore.headroomIsUnpinned(),
      showSelectBallotModal: AppStore.showSelectBallotModal(),
    });
  }

  onVoterStoreChange () {
    // console.log("VoterGuideBallot.jsx onVoterStoreChange");
    if (this.state.mounted) {
      let considerOpeningBallotIntroModal = true;
      if (this.state.waitUntilVoterSignInCompletes) {
        considerOpeningBallotIntroModal = false;
        if (this.state.voter && this.state.voter.is_signed_in) {
          considerOpeningBallotIntroModal = true;
          this.setState({
            waitUntilVoterSignInCompletes: undefined,
          });
          // console.log("onVoterStoreChange, about to historyPush(this.state.pathname):", this.state.pathname);
          historyPush(this.state.pathname);
        }
      }

      if (this.state.hideIntroModalFromCookie || this.state.hideIntroModalFromUrl) {
        considerOpeningBallotIntroModal = false;
      }

      // console.log("VoterGuideBallot.jsx onVoterStoreChange VoterStore.getVoter: ", VoterStore.getVoter());
      if (considerOpeningBallotIntroModal) {
        // hide_intro_modal is the default now
        // showBallotIntroModal: !VoterStore.getInterfaceFlagState(VoterConstants.BALLOT_INTRO_MODAL_SHOWN),
        this.setState({
          voter: VoterStore.getVoter(),
          showBallotIntroModal: false,
          googleCivicElectionId: parseInt(VoterStore.electionId(), 10),
        });
      } else {
        this.setState({
          voter: VoterStore.getVoter(),
          googleCivicElectionId: parseInt(VoterStore.electionId(), 10),
        });
      }
    }
  }

  onBallotStoreChange () {
    // console.log("VoterGuideBallot.jsx onBallotStoreChange, BallotStore.ballotProperties: ", BallotStore.ballotProperties);
    const completionLevelFilterType = BallotStore.getCompletionLevelFilterTypeSaved() || '';
    const { ballot, ballotProperties } = BallotStore;
    const {
      mounted,
    } = this.state;
    let { raceLevelFilterType } = this.state;
    if (!raceLevelFilterType) {
      raceLevelFilterType = ''; // Make sure this is a string
    }

    if (mounted) {
      if (ballotProperties && ballotProperties.ballot_found && ballot && ballot.length === 0) {
        // Ballot is found but ballot is empty. We want to stay put.
        // console.log("onBallotStoreChange: ballotWithItemsFromCompletionFilterType is empty");
      } else {
        const ballotWithItemsFromCompletionFilterType = BallotStore.getBallotByCompletionLevelFilterType(completionLevelFilterType);
        this.setState({
          ballotWithAllItems: BallotStore.getBallotByCompletionLevelFilterType('all'),
          ballotWithItemsFromCompletionFilterType,
        });
        if (ballotWithItemsFromCompletionFilterType && ballotWithItemsFromCompletionFilterType.length) {
          const raceLevelFilterItems = ballotWithItemsFromCompletionFilterType.filter(item => item.race_office_level === raceLevelFilterType ||
            item.kind_of_ballot_item === raceLevelFilterType.toUpperCase());
          this.setState({ doubleFilteredBallotItemsLength: raceLevelFilterItems.length });
        }
      }
    }

    if (ballotProperties) {
      this.setState({
        ballotReturnedWeVoteId: ballotProperties.ballot_returned_we_vote_id || '',
        ballotLocationShortcut: ballotProperties.ballot_location_shortcut || '',
        googleCivicElectionId: parseInt(ballotProperties.google_civic_election_id, 10),
      });
    }
    this.setState({
      ballotElectionList: BallotStore.ballotElectionList(),
      completionLevelFilterType,
    });

    if (this.state.ballotLength !== BallotStore.ballotLength) {
      this.setState({
        ballotLength: BallotStore.ballotLength,
        // raceLevelFilterType: 'Federal',
        showFilterTabs: false,
        foundFirstRaceLevel: false,
      });
    }
    if (this.state.ballotRemainingChoicesLength !== BallotStore.ballotRemainingChoicesLength) {
      this.setState({
        ballotRemainingChoicesLength: BallotStore.ballotRemainingChoicesLength,
      });
    }

    if (Object.keys(this.state.ballotItemUnfurledTracker).length === 0) {
      // console.log("current tracker in Ballotstore", BallotStore.currentBallotItemUnfurledTracker)
      this.setState({
        ballotItemUnfurledTracker: BallotStore.currentBallotItemUnfurledTracker,
      });
    }
  }

  onElectionStoreChange () {
    // console.log("Elections, onElectionStoreChange");
    const electionsList = ElectionStore.getElectionList();
    // const electionsLocationsList = [];
    let voterBallot; // A different format for much of the same data
    const voterBallotList = [];
    let oneBallotLocation;
    let ballotLocationShortcut;
    let ballotReturnedWeVoteId;

    for (let i = 0; i < electionsList.length; i++) {
      const election = electionsList[i];
      // electionsLocationsList.push(election);
      ballotReturnedWeVoteId = '';
      ballotLocationShortcut = '';
      if (election.ballot_location_list && election.ballot_location_list.length) {
        // We want to add the shortcut and we_vote_id for the first ballot location option
        oneBallotLocation = election.ballot_location_list[0]; // eslint-disable-line prefer-destructuring
        ballotLocationShortcut = oneBallotLocation.ballot_location_shortcut || '';
        ballotLocationShortcut = ballotLocationShortcut.trim();
        ballotReturnedWeVoteId = oneBallotLocation.ballot_returned_we_vote_id || '';
        ballotReturnedWeVoteId = ballotReturnedWeVoteId.trim();
      }

      voterBallot = {
        google_civic_election_id: election.google_civic_election_id,
        election_description_text: election.election_name,
        election_day_text: election.election_day_text,
        original_text_for_map_search: '',
        ballot_location_shortcut: ballotLocationShortcut,
        ballot_returned_we_vote_id: ballotReturnedWeVoteId,
      };
      voterBallotList.push(voterBallot);
    }

    this.setState({
      // electionsLocationsList,
      voterBallotList,
    });
  }

  onOrganizationStoreChange () {
    const { organization } = this.state;
    // console.log("VoterGuideBallot onOrganizationStoreChange, organization_we_vote_id: ", organization.organization_we_vote_id);
    this.setState({
      organization: OrganizationStore.getOrganizationByWeVoteId(organization.organization_we_vote_id),
    });
  }

  onSupportStoreChange () {
    // Whenever positions change, we want to make sure to get the latest organization, because it has
    //  position_list_for_one_election and position_list_for_all_except_one_election attached to it
    const { organization } = this.state;
    this.setState({
      organization: OrganizationStore.getOrganizationByWeVoteId(organization.organization_we_vote_id),
    });
  }

  onVoterGuideStoreChange () {
    // console.log("VoterGuideBallot onVoterGuideStoreChange");
    // Update the data for the modal to include the position of the organization related to this ballot item
    const { candidateForModal, measureForModal, organization } = this.state;
    if (candidateForModal) {
      this.setState({
        candidateForModal: {
          ...candidateForModal,
          voter_guides_to_follow_for_latest_ballot_item: VoterGuideStore.getVoterGuidesToFollowForLatestBallotItem(),
        },
        voterGuideOnStage: VoterGuideStore.getVoterGuideForOrganizationIdAndElection(organization.organization_we_vote_id, VoterStore.electionId()),
      });
    } else if (measureForModal) {
      this.setState({
        measureForModal: {
          ...measureForModal,
          voter_guides_to_follow_for_latest_ballot_item: VoterGuideStore.getVoterGuidesToFollowForLatestBallotItem(),
        },
        voterGuideOnStage: VoterGuideStore.getVoterGuideForOrganizationIdAndElection(organization.organization_we_vote_id, VoterStore.electionId()),
      });
    }
  }

  setBallotItemFilterType (raceLevelFilterType, doubleFilteredBallotItemsLength) {
    BallotActions.raceLevelFilterTypeSave(raceLevelFilterType);
    this.setState({
      raceLevelFilterType,
      doubleFilteredBallotItemsLength,
      isSearching: false,
    });
  }

  getEmptyMessageByFilterType (completionLevelFilterType) {
    switch (completionLevelFilterType) {
      case 'filterRemaining':
        return 'You have chosen a candidate for every office and decided on all measures.';
      case 'filterDecided':
        return "You haven't chosen any candidates or decided on any measures yet.";
      default:
        return '';
    }
  }

  showUserEmptyOptions = () => {
    const { completionLevelFilterType } = this.state;
    let { raceLevelFilterType } = this.state;
    if (!raceLevelFilterType) {
      raceLevelFilterType = ''; // Make sure this is a string
    }
    const raceLevel = raceLevelFilterType.toLowerCase();
    switch (completionLevelFilterType) {
      case 'filterDecided':
        return (
          <div>
            <h3>
              You have not decided on any&nbsp;
              {raceLevel}
              &nbsp;ballot items yet.
              <br />
              <br />
              Click on &quot;
              {window.innerWidth > 575 ? 'Remaining Choices' : 'Choices'}
              &quot; to see the&nbsp;
              {raceLevel}
              &nbsp;ballot items you need to decide on.
            </h3>
          </div>
        );
      case 'filterRemaining':
        return (
          <div>
            <h3>
              You do not have any remaining&nbsp;
              {raceLevelFilterType.toLowerCase()}
              &nbsp;ballot items to decide on.
              <br />
              <br />
              Click on &quot;
              {window.innerWidth > 575 ? 'Items Decided' : 'Decided'}
              &quot; to see the&nbsp;
              {raceLevel}
              &nbsp;ballot items you&apos;ve decided on.
            </h3>
          </div>
        );
      default:
        return null;
    }
  }

  handleSearch = (filteredItems) => {
    this.setState({ ballotSearchResults: filteredItems });
  }

  handleToggleSearchBallot = () => {
    const { isSearching } = this.state;
    this.setState({ isSearching: !isSearching });
  }

  toggleBallotIntroModal () {
    const { showBallotIntroModal, location, pathname } = this.state;
    if (location.hash.includes('#')) {
      // Clear out any # from anchors in the URL
      historyPush(pathname);
    }

    this.setState({ showBallotIntroModal: !showBallotIntroModal });
  }

  toggleBallotSummaryModal () {
    const { showBallotSummaryModal } = this.state;
    this.setState({
      showBallotSummaryModal: !showBallotSummaryModal,
    });
  }

  toggleSelectBallotModal (destinationUrlForHistoryPush = '') {
    const { showSelectBallotModal } = this.state;
    if (showSelectBallotModal) {
      if (destinationUrlForHistoryPush && destinationUrlForHistoryPush !== '') {
        historyPush(destinationUrlForHistoryPush);
      }
    } else {
      BallotActions.voterBallotListRetrieve(); // Retrieve a list of ballots for the voter from other elections
    }

    AppActions.setShowSelectBallotModal(!showSelectBallotModal);
  }

  // Needed to scroll to anchor tags based on hash in url (as done for bookmarks)
  hashLinkScroll () {
    const { hash } = window.location;
    if (hash !== '') {
      // Push onto callback queue so it runs after the DOM is updated,
      // this is required when navigating from a different page so that
      // the element is rendered on the page before trying to getElementById.
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);

        if (element) {
          const positionY = element.offsetTop;
          if (isMobile()) {
            window.scrollTo(0, positionY + 250);
          } else {
            window.scrollTo(0, positionY + 196);
          }
        }
      }, 0);
    }
  }

  toggleExpandBallotItemDetails (selectedBallotItemId) {
    if (this.ballotItems[selectedBallotItemId] &&
        this.ballotItems[selectedBallotItemId].ballotItem &&
        this.ballotItems[selectedBallotItemId].ballotItem.toggleExpandDetails) {
      this.ballotItems[selectedBallotItemId].ballotItem.toggleExpandDetails(true);
    }
  }

  ballotItemLinkHasBeenClicked (selectedBallotItemId) {
    const ballotItem = this.state.ballotWithItemsFromCompletionFilterType.find(item => item.we_vote_id === selectedBallotItemId);
    if (ballotItem && ballotItem.kind_of_ballot_item === 'MEASURE') {
      this.setState({
        raceLevelFilterType: 'Measure',
      }, () => this.toggleExpandBallotItemDetails(selectedBallotItemId));
    } else {
      let raceOfficeLevel = 'Federal';
      if (ballotItem && ballotItem.race_office_level) {
        raceOfficeLevel = ballotItem.race_office_level;
      }
      this.setState({
        raceLevelFilterType: raceOfficeLevel,
      }, () => this.toggleExpandBallotItemDetails(selectedBallotItemId));
    }
  }

  componentDidCatch (error, info) {
    // We should get this information to Splunk!
    console.error('VoterGuideBallot caught error: ', `${error} with info: `, info);
  }

  doesOrganizationHavePositionOnOffice (contestOfficeWeVoteId) {
    return OrganizationStore.doesOrganizationHavePositionOnOffice(this.state.organization.organization_we_vote_id, contestOfficeWeVoteId);
  }

  pledgeToVoteWithVoterGuide () {
    console.log('VoterGuideBallot pledgeToVoteWithVoterGuide, this.state.voterGuideOnStage:', this.state.voterGuideOnStage);
    const toastMessage = `Now you match what ${this.state.organization.organization_name} supports or opposes`;
    VoterGuideActions.pledgeToVoteWithVoterGuide(this.state.voterGuideOnStage.we_vote_id);
    showToastSuccess(toastMessage);
  }

  updateOfficeDisplayUnfurledTracker (weVoteId, status) {
    const { ballotItemUnfurledTracker } = this.state;
    const newBallotItemUnfurledTracker = { ...ballotItemUnfurledTracker, [weVoteId]: status };
    BallotActions.voterBallotItemOpenOrClosedSave(newBallotItemUnfurledTracker);
    this.setState({
      ballotItemUnfurledTracker: newBallotItemUnfurledTracker,
    });
  }

  render () {
    renderLog(__filename);
    const ballotBaseUrl = calculateBallotBaseUrl(null, this.props.location.pathname);
    const { classes } = this.props;
    const {
      ballotWithItemsFromCompletionFilterType, showFilterTabs, doubleFilteredBallotItemsLength, completionLevelFilterType,
      isSearching, ballotWithAllItems, ballotSearchResults,
    } = this.state;
    let { raceLevelFilterType } = this.state;
    if (!raceLevelFilterType) {
      raceLevelFilterType = ''; // Make sure this is a string
    }
    // console.log("VoterGuideBallot render, ballotBaseUrl: ", ballotBaseUrl);

    if (!ballotWithItemsFromCompletionFilterType) {
      return (
        <div className="ballot container-fluid well u-stack--md u-inset--md">
          { this.state.showBallotIntroModal ?
            <BallotIntroModal show={this.state.showBallotIntroModal} toggleFunction={this.toggleBallotIntroModal} /> :
            null
          }
          <div className={`ballot__header ${isWebApp() ? 'ballot__header__top-cordova' : ''}`}>
            <BrowserPushMessage incomingProps={this.props} />
            <p className="ballot__date_location">
              If your ballot does not appear momentarily, please
              {' '}
              <Link to="/settings/location">change your address</Link>
              .
            </p>
          </div>
          <BallotElectionList
            ballotBaseUrl={ballotBaseUrl}
            ballotElectionList={this.state.voterBallotList}
            organization_we_vote_id={this.state.organization.organization_we_vote_id}
            showRelevantElections
          />
        </div>
      );
    }

    const voterAddressMissing = this.state.location === null;

    // const ballot_caveat = BallotStore.ballotProperties.ballot_caveat; // ballotProperties might be undefined
    const electionName = BallotStore.currentBallotElectionName;
    const electionDayText = BallotStore.currentBallotElectionDate;
    const sourcePollingLocationWeVoteId = BallotStore.currentBallotPollingLocationSource;
    const organizationAdminUrl = `${webAppConfig.WE_VOTE_SERVER_ROOT_URL}org/${this.state.organization.organization_we_vote_id}/pos/?google_civic_election_id=${VoterStore.electionId()}&state_code=`;
    const ballotReturnedAdminEditUrl = `${webAppConfig.WE_VOTE_SERVER_ROOT_URL}pl/${sourcePollingLocationWeVoteId}/summary/?google_civic_election_id=${VoterStore.electionId()}&state_code=`;

    const emptyBallotButton = completionLevelFilterType !== 'none' && !voterAddressMissing ? (
      <span>
        {/* <Link to={ballotBaseUrl}>
              <Button variant="primary">View Full Ballot</Button>
          </Link> */}
      </span>
    ) : (
      <div className="container-fluid well u-stack--md u-inset--md">
        <Helmet title="Enter Your Address - We Vote" />
        <h3 className="h3">
          Enter address where you are registered to vote
        </h3>
        <div>
          <AddressBox {...this.props} saveUrl={ballotBaseUrl} />
        </div>
      </div>
    );

    // console.log("ballotWithItemsFromCompletionFilterType: ", this.state.ballotWithItemsFromCompletionFilterType);
    const emptyBallot = ballotWithItemsFromCompletionFilterType.length === 0 ? (
      <div>
        <h3 className="text-center">{this.getEmptyMessageByFilterType(completionLevelFilterType)}</h3>
        {emptyBallotButton}
        <div className="container-fluid well u-stack--md u-inset--md">
          <BallotElectionList
            ballotBaseUrl={ballotBaseUrl}
            ballotElectionList={this.state.voterBallotList}
            organization_we_vote_id={this.state.organization.organization_we_vote_id}
          />
        </div>
      </div>
    ) : null;

    const electionDayTextFormatted = electionDayText ? <span>{moment(electionDayText).format('MMM Do, YYYY')}</span> : <span />;

    const inRemainingDecisionsMode = completionLevelFilterType === 'filterRemaining';

    if (ballotWithItemsFromCompletionFilterType.length === 0 && inRemainingDecisionsMode) {
      historyPush(this.state.pathname);
    }

    // Split up the ballot into items that the organization is highlighting vs. the items NOT being discussed
    const ballotWithOrganizationEndorsements = [];
    const ballotWithRemainingItems = [];

    for (let i = 0; i < this.state.ballotWithItemsFromCompletionFilterType.length; i++) {
      const oneContest = this.state.ballotWithItemsFromCompletionFilterType[i];
      if (oneContest && this.doesOrganizationHavePositionOnOffice(oneContest.we_vote_id)) {
        ballotWithOrganizationEndorsements.push(oneContest);
      } else {
        ballotWithRemainingItems.push(oneContest);
      }
    }

    // console.log("VoterGuideBallot SelectBallotModal, this.state.organization.organization_we_vote_id:", this.state.organization.organization_we_vote_id);
    return (
      <div className="ballot">
        { this.state.showBallotIntroModal ? <BallotIntroModal show={this.state.showBallotIntroModal} toggleFunction={this.toggleBallotIntroModal} /> : null }
        { this.state.showSelectBallotModal ? (
          <SelectBallotModal
            ballotElectionList={this.state.ballotElectionList}
            ballotBaseUrl={ballotBaseUrl}
            location={this.state.location}
            organization_we_vote_id={this.state.organization.organization_we_vote_id}
            pathname={this.state.pathname}
            show={this.state.showSelectBallotModal}
            toggleFunction={this.toggleSelectBallotModal}
          />
        ) : null }
        { this.state.showBallotSummaryModal ? <BallotSummaryModal show={this.state.showBallotSummaryModal} toggleFunction={this.toggleBallotSummaryModal} /> : null }
        <div className="card">
          <div className="card-main">
            <Helmet title={`${this.state.organization.organization_name} - We Vote`} />
            <BrowserPushMessage incomingProps={this.props} />
            <header className="ballot__header__group">
              <h1 className={isCordova() ? 'ballot__header__title__cordova' : 'ballot__header__title'}>
                { electionName ? (
                  <span className="u-push--sm">
                    {electionName}
                    {' '}
                    <span className="d-none d-sm-inline">&mdash; </span>
                    <span className="u-gray-mid u-no-break">{electionDayTextFormatted}</span>
                  </span>
                ) : (
                  <span className="u-push--sm">
                         Loading Election...
                  </span>
                )}
              </h1>
              { ballotWithItemsFromCompletionFilterType.length && showFilterTabs ? (
                <div className="ballot__item-filter-tabs">
                  <BallotSearch
                    isSearching={isSearching}
                    onToggleSearch={this.handleToggleSearchBallot}
                    items={ballotWithAllItems}
                    onBallotSearch={this.handleSearch}
                  />
                  { BALLOT_ITEM_FILTER_TYPES.map((oneTypeOfBallotItem) => {
                    const allBallotItemsByFilterType = this.state.ballotWithAllItems.filter((item) => {
                      if (oneTypeOfBallotItem === 'Measure') {
                        return item.kind_of_ballot_item === 'MEASURE';
                      } else {
                        return oneTypeOfBallotItem === item.race_office_level;
                      }
                    });
                    if (allBallotItemsByFilterType.length) {
                      const ballotItemsByFilterType = ballotWithItemsFromCompletionFilterType.filter((item) => {
                        if (oneTypeOfBallotItem === 'Measure') {
                          return item.kind_of_ballot_item === 'MEASURE';
                        } else {
                          return oneTypeOfBallotItem === item.race_office_level;
                        }
                      });
                      return (
                        <div className="ballot_filter_btns" key={oneTypeOfBallotItem}>
                          <Badge
                            classes={{ badge: classes.badge, colorPrimary: classes.badgeColorPrimary }}
                            color={oneTypeOfBallotItem === raceLevelFilterType ? 'primary' : 'default'}
                            badgeContent={ballotItemsByFilterType.length}
                            invisible={ballotItemsByFilterType.length === 0}
                          >
                            {oneTypeOfBallotItem === raceLevelFilterType ?
                              <RadioButtonCheckedIcon classes={{ root: classes.iconRoot }} onClick={() => this.setBallotItemFilterType(oneTypeOfBallotItem, ballotItemsByFilterType.length)} /> : <RadioButtonUncheckedIcon classes={{ root: classes.iconRoot }} onClick={() => this.setBallotItemFilterType(oneTypeOfBallotItem, ballotItemsByFilterType.length)} />}
                            <Chip variant="outlined"
                                color={oneTypeOfBallotItem === raceLevelFilterType ? 'primary' : 'default'}
                                onClick={() => this.setBallotItemFilterType(oneTypeOfBallotItem, ballotItemsByFilterType.length)}
                                className="btn_ballot_filter"
                                classes={{ root: classes.chipRoot }}
                                label={oneTypeOfBallotItem}
                            />
                          </Badge>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })
              }
                </div>
              ) : null
              }
            </header>

            <div className="d-print-none">
              { ballotWithOrganizationEndorsements.length ?
                <PledgeToSupportOrganizationStatusBar organization={this.state.organization} /> :
                null
              }
            </div>

            <div className="d-print-none">
              { ballotWithOrganizationEndorsements.length ? (
                <PledgeToSupportOrganizationButton
                  organization={this.state.organization}
                  pledgeToVoteAction={this.pledgeToVoteWithVoterGuide}
                />
              ) : null
              }
            </div>

            {this.state.ballotWithItemsFromCompletionFilterType.length > 0 ? (
              <div>
                <BallotStatusMessage
                  ballotLocationChosen
                  googleCivicElectionId={this.state.googleCivicElectionId}
                />
              </div>
            ) : null
            }
          </div>
        </div>

        <div className="page-content-container">
          <div className="container-fluid">
            {emptyBallot}
            <div className="row ballot__body-vg">
              <div className="col-xs-12 col-md-12">
                {/* The ballot items the organization wants to promote */}
                <div>
                  {ballotWithOrganizationEndorsements.length > 0 && (
                  <div className={isWebApp() ? 'BallotList' : 'BallotList__cordova'}>
                    {ballotWithOrganizationEndorsements.map(item => (
                      <VoterGuideBallotItemCompressed
                        key={item.we_vote_id}
                        organization={this.props.organization}
                        organization_we_vote_id={this.props.organization.organization_we_vote_id}
                        location={this.props.location}
                        urlWithoutHash={this.props.location.pathname + this.props.location.search}
                        {...item}
                      />
                    ))}
                  </div>
                  )}
                </div>

                {ballotWithOrganizationEndorsements.length && ballotWithRemainingItems.length ?
                  <h4 className="h4">More Ballot Items</h4> :
                  null
                }
                <div>
                  {/* The rest of the ballot items */}
                  {ballotWithRemainingItems.length > 0 && (
                  <div className={isWebApp() ? 'BallotList' : 'BallotList__cordova'}>
                    {(isSearching && ballotSearchResults.length ? ballotSearchResults : ballotWithItemsFromCompletionFilterType).map((item) => {
                    // ballot limited by items by filter type
                    // console.log(raceLevelFilterType);
                      if (raceLevelFilterType === 'All' ||  (isSearching && ballotSearchResults.length) ||
                        (item.kind_of_ballot_item === 'MEASURE' && raceLevelFilterType === 'Measure') ||
                        raceLevelFilterType === item.race_office_level) {
                        return (
                          <BallotItemCompressed
                            currentBallotIdInUrl={this.props.location.hash.slice(1)}
                            key={item.we_vote_id}
                            organization={this.props.organization}
                            organization_we_vote_id={this.props.organization.organization_we_vote_id}
                            updateOfficeDisplayUnfurledTracker={this.updateOfficeDisplayUnfurledTracker}
                            urlWithoutHash={this.props.location.pathname + this.props.location.search}
                            ref={(ref) => { this.ballotItemsCompressedReference[item.we_vote_id] = ref; }}
                            {...item}
                          />
                        );
                      } else {
                        return null;
                      }
                    })
                    }
                      {
                        doubleFilteredBallotItemsLength === 0 &&
                        this.showUserEmptyOptions()
                      }
                  </div>
                  )}
                </div>

                {/* Show links to this candidate in the admin tools */}
                { this.state.voter && (this.state.voter.is_admin || this.state.voter.is_verified_volunteer) &&
                this.props.organization && this.props.organization.organization_we_vote_id ? (
                  <span className="u-wrap-links d-print-none">
                    <span>Admin:</span>
                    <OpenExternalWebSite
                      url={organizationAdminUrl}
                      target="_blank"
                      body={(
                        <span>
                          Open this organization in Admin interface (&quot;
                          {this.props.organization.organization_we_vote_id}
                          &quot;)
                        </span>
                      )}
                    />
                  </span>
                  ) : null
                }

                {/* Show links to the polling location this was copied from in the admin tools */}
                { this.state.voter && sourcePollingLocationWeVoteId && (this.state.voter.is_admin || this.state.voter.is_verified_volunteer) ? (
                  <div className="u-wrap-links d-print-none">
                    Admin link:
                    <OpenExternalWebSite
                      url={ballotReturnedAdminEditUrl}
                      target="_blank"
                      body={(
                        <span>
                        This ballot copied from polling location &quot;
                          {sourcePollingLocationWeVoteId}
                          &quot;
                        </span>
                      )}
                    />
                  </div>
                ) : null
                }
                {
                  this.state.showSelectBallotModal ? (
                    <SelectBallotModal
                      ballotElectionList={this.state.ballotElectionList}
                      ballotBaseUrl={ballotBaseUrl}
                      location={this.props.location}
                      pathname={this.props.pathname}
                      show={this.state.showSelectBallotModal}
                      toggleFunction={this.toggleSelectBallotModal}
                    />
                  ) : null
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(VoterGuideBallot);
