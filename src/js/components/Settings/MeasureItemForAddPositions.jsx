import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { withStyles, withTheme } from '@material-ui/core/styles';
import BallotStore from '../../stores/BallotStore';
import BallotItemSupportOpposeCountDisplay from '../Widgets/BallotItemSupportOpposeCountDisplay';
import { historyPush } from '../../utils/cordovaUtils';
import { renderLog } from '../../utils/logging';
import extractNumber from '../../utils/extractNumber';
import MeasureActions from '../../actions/MeasureActions';
import MeasureStore from '../../stores/MeasureStore';
import ShowMoreFooter from '../Navigation/ShowMoreFooter';
import SupportStore from '../../stores/SupportStore';
import { capitalizeString, shortenText } from '../../utils/textFormat';
import TopCommentByBallotItem from '../Widgets/TopCommentByBallotItem';


class MeasureItemForAddPositions extends Component {
  static propTypes = {
    // currentBallotIdInUrl: PropTypes.string,
    organization: PropTypes.object,
    organization_we_vote_id: PropTypes.string,
    showPositionStatementActionBar: PropTypes.bool,
    // urlWithoutHash: PropTypes.string,
    measureWeVoteId: PropTypes.string.isRequired,
    classes: PropTypes.object,
    theme: PropTypes.object,
  };

  constructor (props) {
    super(props);
    this.state = {
      // ballotItemWeVoteId: '',
      componentDidMountFinished: false,
      measureText: '',
      measureWeVoteId: '',
      noVoteDescription: '',
      organizationWeVoteId: '',
      showPositionStatement: false,
      yesVoteDescription: '',
    };
    this.getMeasureLink = this.getMeasureLink.bind(this);
    this.goToMeasureLink = this.goToMeasureLink.bind(this);
    this.togglePositionStatement = this.togglePositionStatement.bind(this);
  }

  componentDidMount () {
    this.supportStoreListener = SupportStore.addListener(this.onSupportStoreChange.bind(this));
    const measure = MeasureStore.getMeasure(this.props.measureWeVoteId);

    if (this.props.measureWeVoteId && !BallotStore.positionListHasBeenRetrievedOnce(this.props.measureWeVoteId)) {
      MeasureActions.positionListForBallotItemPublic(this.props.measureWeVoteId);
    }
    const organizationWeVoteId = (this.props.organization && this.props.organization.organization_we_vote_id) ? this.props.organization.organization_we_vote_id : this.props.organization_we_vote_id;
    this.setState({
      ballotItemDisplayName: measure.ballot_item_display_name,
      componentDidMountFinished: true,
      measure,
      // measureSubtitle: measure.measure_subtitle,
      measureSupportProps: SupportStore.get(this.props.measureWeVoteId),
      measureText: measure.measure_text,
      measureWeVoteId: this.props.measureWeVoteId,
      noVoteDescription: measure.no_vote_description,
      yesVoteDescription: measure.yes_vote_description,
      organizationWeVoteId,
    });
  }

  componentWillReceiveProps (nextProps) {
    const organizationWeVoteId = (nextProps.organization && nextProps.organization.organization_we_vote_id) ? nextProps.organization.organization_we_vote_id : nextProps.organization_we_vote_id;
    const measure = MeasureStore.getMeasure(nextProps.measureWeVoteId);
    if (nextProps.measureWeVoteId && !BallotStore.positionListHasBeenRetrievedOnce(nextProps.measureWeVoteId)) {
      MeasureActions.positionListForBallotItemPublic(nextProps.measureWeVoteId);
    }
    this.setState({
      ballotItemDisplayName: measure.ballot_item_display_name,
      measure,
      // measureSubtitle: measure.measure_subtitle,
      measureSupportProps: SupportStore.get(nextProps.measureWeVoteId),
      measureText: measure.measure_text,
      measureWeVoteId: nextProps.measureWeVoteId,
      noVoteDescription: measure.no_vote_description,
      yesVoteDescription: measure.yes_vote_description,
      organizationWeVoteId,
    });
  }

  shouldComponentUpdate (nextProps, nextState) {
    // This lifecycle method tells the component to NOT render if componentWillReceiveProps didn't see any changes
    if (this.state.componentDidMountFinished === false) {
      // console.log('shouldComponentUpdate: componentDidMountFinished === false');
      return true;
    }
    if (this.state.organizationWeVoteId !== nextState.organizationWeVoteId) {
      // console.log('this.state.organizationWeVoteId:', this.state.organizationWeVoteId, ', nextState.organizationWeVoteId:', nextState.organizationWeVoteId);
      return true;
    }
    if (this.state.ballotItemDisplayName !== nextState.ballotItemDisplayName) {
      // console.log('this.state.ballotItemDisplayName:', this.state.ballotItemDisplayName, ', nextState.ballotItemDisplayName:', nextState.ballotItemDisplayName);
      return true;
    }
    if (this.state.measure !== nextState.measure) {
      // console.log('this.state.measure:', this.state.measure, ', nextState.measure:', nextState.measure);
      return true;
    }
    if (this.props.showPositionStatementActionBar !== nextProps.showPositionStatementActionBar) {
      // console.log('this.props.showPositionStatementActionBar change');
      return true;
    }
    if (this.state.showPositionStatement !== nextState.showPositionStatement) {
      // console.log('this.state.showPositionStatement change');
      return true;
    }
    if (this.state.measureSupportProps !== undefined && nextState.measureSupportProps !== undefined) {
      const currentNetworkSupportCount = parseInt(this.state.measureSupportProps.support_count) || 0;
      const nextNetworkSupportCount = parseInt(nextState.measureSupportProps.support_count) || 0;
      const currentNetworkOpposeCount = parseInt(this.state.measureSupportProps.oppose_count) || 0;
      const nextNetworkOpposeCount = parseInt(nextState.measureSupportProps.oppose_count) || 0;
      if (currentNetworkSupportCount !== nextNetworkSupportCount || currentNetworkOpposeCount !== nextNetworkOpposeCount) {
        // console.log('shouldComponentUpdate: support or oppose count change');
        return true;
      }
    }
    return false;
  }

  componentWillUnmount () {
    this.supportStoreListener.remove();
  }

  onSupportStoreChange () {
    const { measureWeVoteId } = this.state;
    // Whenever positions change, we want to make sure to get the latest organization, because it has
    //  position_list_for_one_election and position_list_for_all_except_one_election attached to it
    this.setState({
      measureSupportProps: SupportStore.get(measureWeVoteId),
    });
  }

  getMeasureLink (oneMeasureWeVoteId) {
    if (this.state.organizationWeVoteId) {
      // If there is an organization_we_vote_id, signal that we want to link back to voter_guide for that organization
      return `/measure/${oneMeasureWeVoteId}/btvg/${this.state.organizationWeVoteId}`;
    } else {
      // If no organization_we_vote_id, signal that we want to link back to default ballot
      return `/measure/${oneMeasureWeVoteId}/b/btdb/`; // back-to-default-ballot
    }
  }

  goToMeasureLink (oneMeasureWeVoteId) {
    const measureLink = this.getMeasureLink(oneMeasureWeVoteId);
    historyPush(measureLink);
  }

  togglePositionStatement () {
    const { showPositionStatement } = this.state;
    this.setState({
      showPositionStatement: !showPositionStatement,
    });
  }

  render () {
    // console.log('MeasureItemForAddPositions render');
    renderLog(__filename);
    const { noVoteDescription, yesVoteDescription } = this.state;
    let { ballotItemDisplayName } = this.state;
    const { measureText, measureWeVoteId } = this.state;
    if (!measureWeVoteId) {
      return null;
    }
    const { classes, theme } = this.props;
    let ballotDisplay = [];
    if (ballotItemDisplayName) {
      ballotDisplay = ballotItemDisplayName.split(':');
    }
    // measureSubtitle = capitalizeString(measureSubtitle);
    ballotItemDisplayName = capitalizeString(ballotItemDisplayName);

    // let measureGuidesList = VoterGuideStore.getVoterGuidesToFollowForBallotItemId(measureWeVoteId);

    // let measure_for_modal = {
    //   ballotItemDisplayName: ballotItemDisplayName,
    //   voter_guides_to_follow_for_ballot_item_id: measureGuidesList,
    //   kind_of_ballot_item: this.props.kind_of_ballot_item,
    //   measureSubtitle: measureSubtitle,
    //   measure_text: this.props.measure_text,
    //   measure_url: this.props.measure_url,
    //   measureWeVoteId,
    //   position_list: this.props.position_list,
    // };

    // let measureSupportStore = SupportStore.get(measureWeVoteId);
    // let organizationsToFollowSupport = VoterGuideStore.getVoterGuidesToFollowForBallotItemIdSupports(measureWeVoteId);
    // let organizationsToFollowOppose = VoterGuideStore.getVoterGuidesToFollowForBallotItemIdOpposes(measureWeVoteId);

    // // Voter Support or opposition
    // let isVoterSupport = false;
    // let isVoterOppose = false;
    // let voterStatementText = false;
    // const ballotItemSupportStore = SupportStore.get(this.state.ballotItemWeVoteId);
    // if (ballotItemSupportStore !== undefined) {
    //   // console.log('ballotItemSupportStore: ', ballotItemSupportStore);
    //   isVoterSupport = ballotItemSupportStore.is_support;
    //   isVoterOppose = ballotItemSupportStore.is_oppose;
    //   voterStatementText = ballotItemSupportStore.voter_statement_text;
    // }

    return (
      <Card classes={{ root: classes.cardRoot }}>
        <InfoRow>
          <MeasureInfoWrapper onClick={() => { this.goToMeasureLink(measureWeVoteId); }}>
            <Title>
              {ballotDisplay[0]}
              <ArrowForwardIcon
                className="u-show-desktop"
                classes={{ root: classes.cardHeaderIconRoot }}
              />
            </Title>
            <SubTitle>{ballotDisplay[1]}</SubTitle>
            <Info>{shortenText(measureText, 200)}</Info>
          </MeasureInfoWrapper>
          <BallotItemSupportOpposeCountDisplay ballotItemWeVoteId={measureWeVoteId} />
        </InfoRow>
        <ChoicesRow>
          <Choice
            id={`measureItemCompressedChoiceYes-${measureWeVoteId}`}
            brandBlue={theme.palette.primary.main}
            onClick={() => { this.goToMeasureLink(measureWeVoteId); }}
          >
            <ChoiceTitle brandBlue={theme.palette.primary.main}>
              {`Yes On ${extractNumber(ballotItemDisplayName)}`}
            </ChoiceTitle>
            <ChoiceInfo>
              {/* If there is a "yes vote" quote about the measure, show that. If not, show the yesVoteDescription */}
              <TopCommentByBallotItem
                ballotItemWeVoteId={measureWeVoteId}
                learnMoreUrl={this.getMeasureLink(measureWeVoteId)}
                limitToYes
              >
                <span>{shortenText(yesVoteDescription, 200)}</span>
              </TopCommentByBallotItem>
            </ChoiceInfo>
          </Choice>
          <Choice
            id={`measureItemCompressedChoiceNo-${measureWeVoteId}`}
            brandBlue={theme.palette.primary.main}
            onClick={() => { this.goToMeasureLink(measureWeVoteId); }}
          >
            <ChoiceTitle brandBlue={theme.palette.primary.main}>
              {`No On ${extractNumber(ballotItemDisplayName)}`}
            </ChoiceTitle>
            <ChoiceInfo>
              {/* If there is a "yes vote" quote about the measure, show that. If not, show the yesVoteDescription */}
              <TopCommentByBallotItem
                ballotItemWeVoteId={measureWeVoteId}
                learnMoreUrl={this.getMeasureLink(measureWeVoteId)}
                limitToNo
              >
                <span>{shortenText(noVoteDescription, 200)}</span>
              </TopCommentByBallotItem>
            </ChoiceInfo>
          </Choice>
        </ChoicesRow>
        <Divider />
        <ShowMoreFooter showMoreId="measureItemCompressedShowMoreFooter" showMoreLink={() => this.goToMeasureLink(measureWeVoteId)} />
      </Card>
    );
  }
}

const styles = theme => ({
  cardRoot: {
    padding: '16px 16px 8px 16px',
    [theme.breakpoints.down('lg')]: {
      padding: '16px 16px 0 16px',
    },
  },
  endorsementIconRoot: {
    fontSize: 14,
    margin: '.3rem .3rem 0 .5rem',
  },
  cardHeaderIconRoot: {
    marginTop: '-.3rem',
    fontSize: 20,
  },
  cardFooterIconRoot: {
    fontSize: 14,
    margin: '0 0 .1rem .4rem',
  },
});

const InfoRow = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
`;

const ChoicesRow = styled.div`
  display: flex;
  flex-flow: row wrap;
`;

const Choice = styled.div`
  display: flex;
  flex-flow: column;
  padding-right: 8px;
  cursor: pointer;
  transition: all 200ms ease-in;
  @media (min-width: 768px) {
    max-width: 47%;
    border: none;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 0 16px;
    margin-right: 10px;
    margin-bottom: 16px;
    &:hover {
      border: 1px solid ${({ brandBlue }) => brandBlue};
      box-shadow: 0 1px 3px 0 rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 2px 1px -1px rgba(0,0,0,.12);
    }
  }
`;

const ChoiceTitle = styled.h1`
  font-weight: bold;
  color: #4371cc;
`;

const ChoiceInfo = styled.p`
  font-size: 12px;
  color: #777;
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 140%;
  }
`;

const MeasureInfoWrapper = styled.div`
  display: flex;
  flex-flow: column;
  max-width: 75%;
  cursor: pointer;
  user-select: none;
  padding-right: 8px;
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 70%;
  }
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: bold;
  margin: .1rem 0;
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    font-size: 16px;
  }
`;

const SubTitle = styled.h3`
  font-size: 16px;
  font-weight: 300;
  color: #555;
  margin-top: .6rem;
  width: 135%;
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    font-size: 13px;
  }
`;

const Info = styled.p`
  font-size: 13px;
  font-weight: 300;
  color: #777;
  width: 135%;
`;

export default withTheme(withStyles(styles)(MeasureItemForAddPositions));
