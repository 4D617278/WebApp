import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import ReactSVG from 'react-svg';
import { cordovaDot } from '../../utils/cordovaUtils';
import ImageHandler from '../ImageHandler';
import IssueActions from '../../actions/IssueActions';
import { showToastError, showToastSuccess } from '../../utils/showToast';
import { renderLog } from '../../utils/logging';
import checkMarkIcon from '../../../img/global/svg-icons/check-mark-v2-40x43.svg';

const svgStyle = { fill: '#4B4B4B', padding: '1px', width: '67%', height: '100%', marginBottom: '33%' };

function importAll (r) {
  const images = {};
  r.keys().forEach((item) => { images[item.replace('./', '')] = r(item); });
  return images;
}
const images = importAll(require.context('../../../img/global/svg-icons/issues', false, /\.(svg)$/));

export default class IssueFollowToggleSquare extends Component {
  static propTypes = {
    editMode: PropTypes.bool,
    grid: PropTypes.string,
    isFollowing: PropTypes.bool,
    issueWeVoteId: PropTypes.string.isRequired,
    issueName: PropTypes.string.isRequired,
    issueDescription: PropTypes.string,
    // issueImageUrl: PropTypes.string,
    issueIconLocalPath: PropTypes.string,
    onIssueFollow: PropTypes.func,
    onIssueStopFollowing: PropTypes.func,
    readOnly: PropTypes.bool,
    sideBar: PropTypes.bool,
  };

  constructor (props) {
    super(props);
    this.state = {
      isFollowing: props.isFollowing,
    };
    this.onIssueFollow = this.onIssueFollow.bind(this);
    this.onIssueStopFollowing = this.onIssueStopFollowing.bind(this);
  }

  onIssueFollow () {
    // This check is necessary as we enable follow when user clicks on Issue text
    const { issueWeVoteId, onIssueFollow, issueName } = this.props;
    if (!this.state.isFollowing) {
      this.setState({ isFollowing: true });
      IssueActions.issueFollow(issueWeVoteId);
      if (onIssueFollow) {
        onIssueFollow(issueWeVoteId);
      }
      showToastSuccess(`Now following ${issueName}!`);
    }
  }

  onIssueStopFollowing () {
    const { issueWeVoteId, issueName } = this.props;
    this.setState({ isFollowing: false });
    IssueActions.issueStopFollowing(issueWeVoteId);
    if (this.props.onIssueStopFollowing) {
      this.props.onIssueStopFollowing(issueWeVoteId);
    }
    showToastError(`You've stopped following ${issueName}.`);
  }

  render () {
    renderLog('IssueFollowToggleSquare');  // Set LOG_RENDER_EVENTS to log all renders
    const {
      grid, issueIconLocalPath, issueDescription, readOnly, editMode, issueName, sideBar,
    } = this.props;
    const { isFollowing } = this.state;
    if (!this.state) {
      return <div />;
    }
    if (readOnly === true && !editMode) {
      return (
        <div className={`${grid} intro-modal__square${sideBar ? '__sidebar' : ''}`}>
          <ReactSVG src={cordovaDot(images[`${issueIconLocalPath}.svg`])} svgStyle={svgStyle} />
          <ImageHandler
            className="intro-modal__square-check-mark"
            imageUrl={cordovaDot(checkMarkIcon)}
            alt="Following"
          />
          <h4 className="intro-modal__white-space intro-modal__square-name">{issueName}</h4>
          { issueDescription && issueDescription.length ? (
            <Tooltip id="organizationDescriptionTooltip" title={issueDescription}>
              <i className="fas fa-info-circle fa-lg d-none d-sm-block intro-modal__square-details" aria-hidden="true" />
            </Tooltip>
          ) : null
          }
        </div>
      );
    } else {
      return isFollowing ? (
        <div className={`${grid} intro-modal__square u-cursor--pointer`} onClick={this.onIssueStopFollowing}>
          <ReactSVG src={cordovaDot(images[`${issueIconLocalPath}.svg`])} svgStyle={svgStyle} />
          <ImageHandler
            className="intro-modal__square-check-mark"
            imageUrl={cordovaDot(checkMarkIcon)}
            alt="Following"
          />
          <h4 className="intro-modal__white-space intro-modal__square-name intro-modal__following">{issueName}</h4>
          { issueDescription && issueDescription.length ? (
            <Tooltip id="organizationDescriptionTooltip" title={issueDescription}>
              <i className="fas fa-info-circle fa-lg d-none d-sm-block intro-modal__square-details" aria-hidden="true" />
            </Tooltip>
          ) : null
          }
        </div>
      ) : (
        <div className={`${grid} intro-modal__square u-cursor--pointer`} onClick={this.onIssueFollow}>
          <ReactSVG src={cordovaDot(`/img/global/svg-icons/issues/${issueIconLocalPath}.svg`)} svgStyle={svgStyle} />

          <h4 className="intro-modal__white-space intro-modal__square-name">{issueName}</h4>
          { issueDescription && issueDescription.length ? (
            <Tooltip id="organizationDescriptionTooltip" title={issueDescription}>
              <i className="fas fa-info-circle fa-lg d-none d-sm-block intro-modal__square-details" aria-hidden="true" />
            </Tooltip>
          ) : null
            }

        </div>
      );
    }
  }
}
