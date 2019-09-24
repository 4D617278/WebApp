import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { capitalizeString } from '../../utils/textFormat';
import LoadingWheel from '../../components/LoadingWheel';
import { renderLog } from '../../utils/logging';
import MeasureItem from '../../components/Ballot/MeasureItem';
import MeasureStickyHeader from '../../components/Ballot/MeasureStickyHeader';
import MeasureActions from '../../actions/MeasureActions';
import MeasureStore from '../../stores/MeasureStore';
import OpenExternalWebSite from '../../components/Widgets/OpenExternalWebSite';
import OrganizationActions from '../../actions/OrganizationActions';
import PositionList from '../../components/Ballot/PositionList';
import SupportActions from '../../actions/SupportActions';
import VoterGuideStore from '../../stores/VoterGuideStore';
import VoterStore from '../../stores/VoterStore';
import AppStore from '../../stores/AppStore';
import webAppConfig from '../../config';

// The component /routes/VoterGuide/OrganizationVoterGuideMeasure is based on this component
export default class Measure extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
  };

  constructor (props) {
    super(props);
    this.state = {
      measure: {},
      measureWeVoteId: '',
      positionListFromAdvisersFollowedByVoter: [],
      scrolledDown: AppStore.getScrolledDown(),
    };
  }

  componentDidMount () {
    this.measureStoreListener = MeasureStore.addListener(this.onMeasureStoreChange.bind(this));
    this.appStoreListener = AppStore.addListener(this.onAppStoreChange.bind(this));
    MeasureActions.measureRetrieve(this.props.params.measure_we_vote_id);
    MeasureActions.positionListForBallotItemPublic(this.props.params.measure_we_vote_id);

    this.voterGuideStoreListener = VoterGuideStore.addListener(this.onVoterGuideStoreChange.bind(this));
    // VoterGuideActions.voterGuidesToFollowRetrieveByBallotItem(this.props.params.measure_we_vote_id, 'MEASURE');

    // Make sure supportProps exist for this Measure when browser comes straight to measure page
    SupportActions.retrievePositionsCountsForOneBallotItem(this.props.params.measure_we_vote_id);
    OrganizationActions.organizationsFollowedRetrieve();

    // TODO CREATE THIS
    // AnalyticsActions.saveActionMeasure(VoterStore.electionId(), this.props.params.measure_we_vote_id);
    this.setState({
      measureWeVoteId: this.props.params.measure_we_vote_id,
      positionListFromAdvisersFollowedByVoter: MeasureStore.getPositionList(this.props.params.measure_we_vote_id),
    });
  }

  componentWillReceiveProps (nextProps) {
    // When a new measure is passed in, update this component to show the new data
    if (nextProps.params.measure_we_vote_id !== this.state.measureWeVoteId) {
      MeasureActions.measureRetrieve(nextProps.params.measure_we_vote_id);
      MeasureActions.positionListForBallotItemPublic(nextProps.params.measure_we_vote_id);
      // VoterGuideActions.voterGuidesToFollowRetrieveByBallotItem(nextProps.params.measure_we_vote_id, 'MEASURE');
      this.setState({
        measureWeVoteId: nextProps.params.measure_we_vote_id,
        positionListFromAdvisersFollowedByVoter: MeasureStore.getPositionList(nextProps.params.measure_we_vote_id),
      });
    }
  }

  componentWillUnmount () {
    this.measureStoreListener.remove();
    this.voterGuideStoreListener.remove();
    this.appStoreListener.remove();
  }

  onAppStoreChange () {
    this.setState({
      scrolledDown: AppStore.getScrolledDown(),
    });
  }

  onMeasureStoreChange () {
    const { measureWeVoteId } = this.state;
    // console.log("Measure, onMeasureStoreChange");
    this.setState({
      measure: MeasureStore.getMeasure(measureWeVoteId),
      positionListFromAdvisersFollowedByVoter: MeasureStore.getPositionList(measureWeVoteId),
    });
  }

  onVoterGuideStoreChange () {
    // MeasureActions.measureRetrieve(this.state.measureWeVoteId);
    MeasureActions.positionListForBallotItemPublic(this.state.measureWeVoteId);
    // Also update the position count for *just* this candidate, since it might not come back with positionsCountForAllBallotItems

    SupportActions.retrievePositionsCountsForOneBallotItem(this.state.measureWeVoteId);
  }

  render () {
    const {
      positionListFromAdvisersFollowedByVoter, measure, scrolledDown,
    } = this.state;
    renderLog(__filename);

    if (!measure || !measure.ballot_item_display_name) {
      // TODO DALE If the measureWeVoteId is not valid, we need to update this with a notice
      return (
        <div className="container-fluid well u-stack--md u-inset--md">
          <div>{LoadingWheel}</div>
          <br />
        </div>
      );
    }

    const measureName = capitalizeString(measure.ballot_item_display_name);
    const titleText = `${measureName} - We Vote`;
    const descriptionText = `Information about ${measureName}`;
    const voter = VoterStore.getVoter();
    const measureAdminEditUrl = `${webAppConfig.WE_VOTE_SERVER_ROOT_URL}m/${measure.id}/edit/?google_civic_election_id=${VoterStore.electionId()}&state_code=`;

    return (
      <section className="card">
        <Helmet
          title={titleText}
          meta={[{ name: 'description', content: descriptionText }]}
        />
        {
          scrolledDown && (
            <MeasureStickyHeader measureWeVoteId={measure.we_vote_id} />
          )
        }
        <MeasureItem measureWeVoteId={measure.we_vote_id} />
        <div className="card__additional">
          { positionListFromAdvisersFollowedByVoter && (
            <div>
              <PositionList
                incomingPositionList={positionListFromAdvisersFollowedByVoter}
                hideSimpleSupportOrOppose
                ballotItemDisplayName={measure.ballot_item_display_name}
                params={this.props.params}
              />
            </div>
          )}
        </div>
        {/* Show links to this candidate in the admin tools */}
        { (voter.is_admin || voter.is_verified_volunteer) && (
          <span className="u-wrap-links d-print-none">
            Admin:
            <OpenExternalWebSite
              url={measureAdminEditUrl}
              target="_blank"
              className="open-web-site open-web-site__no-right-padding"
              body={(
                <span>
                  edit
                  {measureName}
                </span>
              )}
            />
          </span>
        )}
      </section>
    );
  }
}
