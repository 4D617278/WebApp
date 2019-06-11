import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import ListItem from '@material-ui/core/ListItem';
import { capitalizeString, sentenceCaseString } from '../../utils/textFormat';
import { renderLog } from '../../utils/logging';

export default class BallotSideBarLink extends Component {
  static propTypes = {
    ballotItemLinkHasBeenClicked: PropTypes.func,
    url: PropTypes.string,
    id: PropTypes.string,
    label: PropTypes.string,
    subtitle: PropTypes.string,
    displaySubtitles: PropTypes.bool,
    onClick: PropTypes.func,
  };

  constructor (props) {
    super(props);
    this.state = {};
  }

  render () {
    renderLog(__filename);
    const labelInSentenceCase = capitalizeString(this.props.label);
    const subtitleInSentenceCase = sentenceCaseString(this.props.subtitle);

    return (
      <Link id={this.props.id} to={this.props.url} className="BallotItem__summary__item__display-name">
        <ListItem
          button
          onClick={() => {
            this.props.onClick.bind(this);
            if (this.props.ballotItemLinkHasBeenClicked && this.props.url) {
              const selectedBallotItemId = this.props.url.split('#')[1];
              if (selectedBallotItemId) {
                this.props.ballotItemLinkHasBeenClicked(selectedBallotItemId);
              }
            }
          }}
        >
          <div>

            <span className="BallotItem__summary__display-name">{labelInSentenceCase}</span>
            { this.props.displaySubtitles ? (
              <span className="BallotItem__summary__item__subtitle">
                {' '}
                {subtitleInSentenceCase}
              </span>
            ) : null }
          </div>
        </ListItem>
      </Link>
    );
  }
}
