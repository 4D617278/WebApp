import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import CandidateList from '../../components/Ballot/CandidateList';
import { capitalizeString } from '../../utils/textFormat';
import AnalyticsActions from '../../actions/AnalyticsActions';
import IssueActions from '../../actions/IssueActions';
import IssueStore from '../../stores/IssueStore';
import LoadingWheel from '../../components/LoadingWheel';
import { renderLog } from '../../utils/logging';
import OfficeActions from '../../actions/OfficeActions';
import OfficeStore from '../../stores/OfficeStore';
import SearchAllActions from '../../actions/SearchAllActions';
import Testimonial from '../../components/Widgets/Testimonial';
import VoterStore from '../../stores/VoterStore';
import { cordovaDot } from '../../utils/cordovaUtils';


// This is related to routes/VoterGuide/OrganizationVoterGuideOffice
export default class Office extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
  };

  constructor (props) {
    super(props);
    this.state = {
      office: {},
      officeWeVoteId: '',
    };
  }

  componentDidMount () {
    if (IssueStore.getPreviousGoogleCivicElectionId() < 1) {
      IssueActions.issuesRetrieveForElection(VoterStore.electionId());
    }

    this.officeStoreListener = OfficeStore.addListener(this.onOfficeStoreChange.bind(this));
    const office = OfficeStore.getOffice(this.props.params.office_we_vote_id);

    if (!office || !office.ballot_item_display_name) {
      OfficeActions.officeRetrieve(this.props.params.office_we_vote_id);
    } else {
      this.setState({ office });
    }

    this.setState({
      officeWeVoteId: this.props.params.office_we_vote_id,
    });

    AnalyticsActions.saveActionOffice(VoterStore.electionId(), this.props.params.office_we_vote_id);
    SearchAllActions.exitSearch();
  }

  componentWillReceiveProps (nextProps) {
    // When a new office is passed in, update this component to show the new data
    const office = OfficeStore.getOffice(nextProps.params.office_we_vote_id);

    if (!office || !office.ballot_item_display_name) {
      this.setState({ officeWeVoteId: nextProps.params.office_we_vote_id });
      OfficeActions.officeRetrieve(nextProps.params.office_we_vote_id);
    } else {
      this.setState({ office, officeWeVoteId: nextProps.params.office_we_vote_id });
    }

    // Display the office name in the search box
    // var { candidate } = this.state;
    // var searchBoxText = candidate.ballot_item_display_name || "";  // TODO DALE Not working right now
    SearchAllActions.exitSearch();
  }

  componentWillUnmount () {
    this.officeStoreListener.remove();
  }

  onOfficeStoreChange () {
    const { officeWeVoteId } = this.state;
    const office = OfficeStore.getOffice(officeWeVoteId);
    this.setState({ office });
  }

  render () {
    renderLog(__filename);
    const { office } = this.state;

    if (!office || !office.ballot_item_display_name) {
      // TODO DALE If the officeWeVoteId is not valid, we need to update this with a notice
      return (
        <div className="container-fluid well u-stack--md u-inset--md">
          <div>{LoadingWheel}</div>
          <br />
        </div>
      );
    }

    const officeName = capitalizeString(office.ballot_item_display_name);
    const titleText = `${officeName} - We Vote`;
    const descriptionText = `Choose who you support for ${officeName} in this election`;

    // =========== Testimonial variables ============================

    const testimonialAuthor = 'Dale M., Oakland, California';
    const imageUrl = cordovaDot('/img/global/photos/Dale_McGrew-200x200.jpg');
    const testimonial = 'Following values that are important to me lets me see the opinions of other people who share my values.';

    // ==============================================================


    return (
      <div style={{ display: 'flex' }}>
        <Helmet
          title={titleText}
          meta={[{ name: 'description', content: descriptionText }]}
        />
        <div className="col-sm-12 col-lg-9">
          { office.candidate_list ? (
            <div>
              <CandidateList
                contest_office_name={office.ballot_item_display_name}
              >
                {office.candidate_list}
              </CandidateList>
            </div>
          ) :
            <span>No candidates found.</span>
        }
        </div>
        <div className="col-lg-3 d-none d-lg-block">
          <Testimonial
            imageUrl={imageUrl}
            testimonialAuthor={testimonialAuthor}
            testimonial={testimonial}
          />
        </div>
      </div>
    );
  }
}


