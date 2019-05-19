import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import CandidateStore from '../../stores/CandidateStore';
import FollowToggle from '../Widgets/FollowToggle';
import MeasureStore from '../../stores/MeasureStore';
import { stringContains } from '../../utils/textFormat';
import VoterGuideDisplayForList from './VoterGuideDisplayForList';
import { showToastSuccess } from '../../utils/showToast';
import { renderLog } from '../../utils/logging';
import EndorsementCard from '../Widgets/EndorsementCard';

export default class GuideList extends PureComponent {
  static propTypes = {
    ballotItemWeVoteId: PropTypes.string,
    incomingVoterGuideList: PropTypes.array,
    instantRefreshOn: PropTypes.bool,
  };

  constructor (props) {
    super(props);
    this.state = {
      voterGuideList: [],
      ballotItemWeVoteId: '',
      // organizationsWithPositions: [],
    };
  }

  componentDidMount () {
    // console.log('GuideList componentDidMount');
    const { ballotItemWeVoteId } = this.state;
    const voterGuideList = this.sortOrganizations(this.props.incomingVoterGuideList, ballotItemWeVoteId);
    this.setState({
      voterGuideList,
      ballotItemWeVoteId: this.props.ballotItemWeVoteId,
    }, () => {
      const orgsWithPositions = this.getOrganizationsWithPositions();
      this.setState({
        // organizationsWithPositions: orgsWithPositions,
        filteredOrganizationsWithPositions: orgsWithPositions,
      });
      // console.log(orgsWithPositions);
    });
  }

  componentWillReceiveProps (nextProps) {
    // console.log('GuideList componentWillReceiveProps');
    // Do not update the state if the voterGuideList list looks the same, and the ballotItemWeVoteId hasn't changed
    const { ballotItemWeVoteId } = this.state;
    const voterGuideList = this.sortOrganizations(nextProps.incomingVoterGuideList, ballotItemWeVoteId);
    this.setState({
      voterGuideList,
      ballotItemWeVoteId: nextProps.ballotItemWeVoteId,
    }, () => {
      const orgsWithPositions = this.getOrganizationsWithPositions();
      // this.setState({
      //   organizationsWithPositions: orgsWithPositions,
      // });
      if (!this.state.filteredOrganizationsWithPositions || !this.state.filteredOrganizationsWithPositions.length) {
        this.setState({ filteredOrganizationsWithPositions: orgsWithPositions });
      }
    });
  }

  getOrganizationsWithPositions = () => this.state.voterGuideList.map((organization) => {
    let organizationPositionForThisBallotItem;
    if (stringContains('cand', this.state.ballotItemWeVoteId)) {
      organizationPositionForThisBallotItem = CandidateStore.getPositionAboutCandidateFromOrganization(this.state.ballotItemWeVoteId, organization.organization_we_vote_id);
      // console.log({ ...organizationPositionForThisBallotItem, ...organization });
    } else if (stringContains('meas', this.state.ballotItemWeVoteId)) {
      organizationPositionForThisBallotItem = MeasureStore.getPositionAboutMeasureFromOrganization(this.state.ballotItemWeVoteId, organization.organization_we_vote_id);
    }
    return { ...organizationPositionForThisBallotItem, ...organization };
  });

  sortOrganizations (organizationsList, ballotItemWeVoteId) {
    // console.log('sortOrganizations: ', organizationsList, 'ballotItemWeVoteId: ', ballotItemWeVoteId);
    if (organizationsList && ballotItemWeVoteId) {
      // console.log('Checking for resort');
      const arrayLength = organizationsList.length;
      let organization;
      let organizationPositionForThisBallotItem;
      const sortedOrganizations = [];
      for (let i = 0; i < arrayLength; i++) {
        organization = organizationsList[i];
        organizationPositionForThisBallotItem = null;
        if (ballotItemWeVoteId && organization.organization_we_vote_id) {
          if (stringContains('cand', ballotItemWeVoteId)) {
            organizationPositionForThisBallotItem = CandidateStore.getPositionAboutCandidateFromOrganization(ballotItemWeVoteId, organization.organization_we_vote_id);
          } else if (stringContains('meas', ballotItemWeVoteId)) {
            organizationPositionForThisBallotItem = MeasureStore.getPositionAboutMeasureFromOrganization(ballotItemWeVoteId, organization.organization_we_vote_id);
          }
        }
        if (organizationPositionForThisBallotItem && organizationPositionForThisBallotItem.statement_text) {
          // console.log('sortOrganizations unshift');
          sortedOrganizations.unshift(organization);
        } else {
          // console.log('sortOrganizations push');
          sortedOrganizations.push(organization);
        }
      }
      return sortedOrganizations;
    }
    return organizationsList;
  }

  handleIgnore (organizationWeVoteId) {
    const { voterGuideList } = this.state;
    // OrganizationActions.organizationFollowIgnore(organizationWeVoteId); // This is run within FollowToggle
    this.setState({
      voterGuideList: voterGuideList.filter(
        org => org.organization_we_vote_id !== organizationWeVoteId,
      ),
    });
    showToastSuccess('Added to ignore list.');
  }

  render () {
    // console.log('GuideList render');
    renderLog(__filename);
    if (this.state.filteredOrganizationsWithPositions === undefined) {
      // console.log('GuideList this.state.organizations_to_follow === undefined');
      return null;
    }

    // console.log('GuideList voterGuideList: ', this.state.voterGuideList);

    if (!this.state.filteredOrganizationsWithPositions) {
      return (
        <div className="guidelist card-child__list-group">
          <div className="u-flex u-flex-column u-items-center">
            <div className="u-margin-top--sm u-stack--sm u-no-break">
              No results found.
            </div>
            <EndorsementCard
              className="btn endorsement-btn btn-sm"
              bsPrefix="u-margin-top--sm u-stack--xs"
              variant="primary"
              buttonText="Organization Missing?"
              text="Don't see an organization you want to follow?"
            />
          </div>
        </div>
      );
    }
    return (
      <div className="guidelist card-child__list-group">
        {this.state.filteredOrganizationsWithPositions.map((organization) => {
          const handleIgnoreFunc = () => {
            this.handleIgnore(organization.organization_we_vote_id);
          };

          return (
            <VoterGuideDisplayForList
              key={organization.organization_we_vote_id}
              {...organization}
            >
              <FollowToggle
                  organizationWeVoteId={organization.organization_we_vote_id}
                  handleIgnore={handleIgnoreFunc}
              />
            </VoterGuideDisplayForList>
          );
        })
        }
      </div>
    );
  }
}
