import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import styled from 'styled-components';
import BallotStore from '../../stores/BallotStore';
import BallotSideBarLink from './BallotSideBarLink';
import { renderLog } from '../../utils/logging';

// December 2018:  We want to work toward being airbnb style compliant, but for now these are disabled in this file to minimize massive changes
/* eslint no-restricted-syntax: 1 */
class BallotSideBar extends Component {
  static propTypes = {
    ballotWithAllItemsByFilterType: PropTypes.array,
    ballotItemLinkHasBeenClicked: PropTypes.func,
    displayTitle: PropTypes.bool,
    displaySubtitles: PropTypes.bool,
    onClick: PropTypes.func,
    pathname: PropTypes.string,
    classes: PropTypes.object,
  };

  static defaultProps = {
    pathname: '/ballot',
  };

  constructor (props) {
    super(props);
    this.state = {
      componentDidMountFinished: false,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount () {
    const unsorted = BallotStore.ballot;
    this.setState({
      ballot: this._sortBallots(unsorted),
      componentDidMountFinished: true,
    });
    this.ballotStoreListener = BallotStore.addListener(this.onBallotStoreChange.bind(this));
  }

  shouldComponentUpdate (nextProps, nextState) {
    // This lifecycle method tells the component to NOT render if componentWillReceiveProps didn't see any changes
    if (this.state.componentDidMountFinished === false) {
      // console.log("shouldComponentUpdate: componentDidMountFinished === false");
      return true;
    }
    if (this.state.ballot === undefined && nextState.ballot !== undefined) {
      // console.log("shouldComponentUpdate: new ballot found");
      return true;
    }
    if (this.state.ballot !== undefined && this.state.ballot.length !== nextState.ballot.length) {
      // console.log("shouldComponentUpdate: changed this.props.ballot.length", this.state.ballot.length, ", nextState.ballot.length", nextState.ballot.length);
      return true;
    }
    if (this.props.ballotWithAllItemsByFilterType.length !== nextProps.ballotWithAllItemsByFilterType.length) {
      // console.log("shouldComponentUpdate: changed this.props.ballotWithAllItemsByFilterType.length", this.props.ballotWithAllItemsByFilterType.length, ", nextState.ballotWithAllItemsByFilterType.length", nextProps.ballotWithAllItemsByFilterType.length);
      return true;
    }
    if (this.props.displayTitle !== nextProps.displayTitle) {
      // console.log("shouldComponentUpdate: changed this.props.displayTitle", this.props.displayTitle, ", nextState.displayTitle", nextProps.displayTitle);
      return true;
    }
    if (this.props.pathname !== nextProps.pathname) {
      // console.log("shouldComponentUpdate: changed this.props.pathname", this.props.pathname, ", nextState.pathname", nextProps.pathname);
      return true;
    }
    return false;
  }


  componentWillUnmount () {
    this.ballotStoreListener.remove();
  }

  onBallotStoreChange () {
    const unsorted = BallotStore.ballot;
    this.setState({
      ballot: this._sortBallots(unsorted),
    });
  }

  _sortBallots (unsorted) {
    if (unsorted) {
      // temporary array holds objects with position and sort-value
      const mapped = unsorted.map((item, i) => ({ index: i, value: item }));

      // sorting the mapped array based on local_ballot_order which came from the server
      mapped.sort((a, b) => +(
        parseInt(a.value.local_ballot_order, 10) >
            parseInt(b.value.local_ballot_order, 10)
      ) ||
          +(
            parseInt(a.value.local_ballot_order, 10) ===
            parseInt(b.value.local_ballot_order, 10)
          ) - 1);

      const orderedArray = [];
      for (const element of mapped) {
        orderedArray.push(element.value);
      }

      return orderedArray;
    } else {
      return {};
    }
  }

  handleClick () {
    // Fullscreen mode won't pass an onClick function, since the BallotSideBar does not go away after a click
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  filteredBallotToRender (ballot, ballotWithAllItemIdsByFilterType, type, key) {
    const filteredBallot = ballot.filter((item) => {
      if (item.kind_of_ballot_item === 'MEASURE') {
        return type === 'Measure';
      } else {
        return type === item.race_office_level;
      }
    });

    if (!filteredBallot.length) {
      return null;
    }

    const filteredBallotListItems = filteredBallot.map((item) => {
      if (
        item.kind_of_ballot_item === 'OFFICE' ||
        item.kind_of_ballot_item === 'MEASURE'
      ) {
        return (
          <BallotSideBarLink
            url={this.renderUrl(item.we_vote_id, ballotWithAllItemIdsByFilterType)}
            ballotItemLinkHasBeenClicked={this.props.ballotItemLinkHasBeenClicked}
            label={item.ballot_item_display_name}
            subtitle={item.measure_subtitle}
            key={`ballot-side-bar-${item.we_vote_id}`}
            displaySubtitles={this.props.displaySubtitles}
            id={`ballotSideBarLink-${item.we_vote_id}`}
            onClick={this.handleClick}
          />
        );
      } else {
        return <span />;
      }
    });

    return (
      <div className="BallotItem__summary__group" key={key}>
        <div className="BallotItem__summary__group-title">
          {type === 'Measure' ? 'Ballot Measures' : type}
        </div>
        <ul className="BallotItem__summary__list">
          {filteredBallotListItems}
        </ul>
      </div>
    );
  }

  renderUrl (ballotItemWeVoteId) {
    if (ballotItemWeVoteId.indexOf('meas') > -1) return `/measure/${ballotItemWeVoteId}/b/btdb/`;
    return `/office/${ballotItemWeVoteId}/b/btdb/`;
  }

  render () {
    // console.log("BallotSideBar render");
    renderLog(__filename);

    // let turnedOnNPSInput = false;
    const BALLOT_ITEM_FILTER_TYPES = ['Federal', 'State', 'Measure', 'Local'];

    const { ballot } = this.state;
    const { classes, ballotWithAllItemsByFilterType } = this.props;
    if (ballot && ballot.length) {
      const ballotWithAllItemIdsByFilterType = [];
      ballotWithAllItemsByFilterType.forEach((itemByFilterType) => {
        ballotWithAllItemIdsByFilterType.push(itemByFilterType.we_vote_id);
      });

      return (
        <div className="card">
          { this.props.displayTitle ? (
            <Paper>
              <Typography variant="h4" classes={{ root: classes.typography }}>Summary of Ballot Items</Typography>
            </Paper>
          ) :
            null
          }
          <List>
            { BALLOT_ITEM_FILTER_TYPES.map((type, key) => this.filteredBallotToRender(ballot, ballotWithAllItemIdsByFilterType, type, key))}
          </List>
          <div className="h4 text-left" />
          <SidebarFooter>
            <span className="terms-and-privacy">
              <Link id="ballotSideBarTermsOfService" to="/more/terms">
                <span className="u-no-break">Terms of Service</span>
              </Link>
              <span style={{ paddingLeft: 20 }} />
              <Link id="ballotSideBarPrivacyPolicy" to="/more/privacy">
                <span className="u-no-break">Privacy Policy</span>
              </Link>
            </span>
          </SidebarFooter>
          <SidebarFooter>
            <span className="terms-and-privacy">
              <Link id="ballotSideBarAttributions" to="/more/attributions">Attributions</Link>
            </span>
          </SidebarFooter>
        </div>
      );
    } else {
      return <div />;
    }
  }
}

const styles = theme => ({
  typography: {
    padding: '16px 0',
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
    [theme.breakpoints.down('lg')]: {
      padding: '12px 0',
    },
  },
});

const SidebarFooter = styled.div`
  margin-left: 8px;
`;

export default withStyles(styles)(BallotSideBar);
