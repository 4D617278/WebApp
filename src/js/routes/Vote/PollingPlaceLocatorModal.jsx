import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import {
  cordovaDot, cordovaOpenSafariView, hasIPhoneNotch, historyPush, isWebApp,
} from '../../utils/cordovaUtils';
import { renderLog } from '../../utils/logging';
import closeIcon from '../../../img/global/icons/x-close.png';
import PollingPlaceLocator from '../../components/Vote/PollingPlaceLocator';

export default class PollingPlaceLocatorModal extends Component {
  static propTypes = {
    onExit: PropTypes.func,
  };

  constructor (props) {
    super(props);
    this.state = {
      showPollingLocatorModal: true,
    };
    this.openPollingLocationModal = this.openPollingLocationModal.bind(this);
  }

  openPollingLocationModal () {
    const { showPollingLocatorModal } = this.state;
    this.setState({ showPollingLocatorModal: !showPollingLocatorModal });
    historyPush('/ballot/vote');
  }

  render () {
    renderLog(__filename);

    if (isWebApp()) {
      return (
        <Modal
          bsPrefix="background-brand-blue modal"
          show={this.state.showPollingLocatorModal}
          onHide={() => this.openPollingLocationModal(this)}
        >
          <Modal.Body>
            <div className="intro-modal__close">
              <button type="button"
                onClick={this.openPollingLocationModal}
                className={`intro-modal__close-anchor ${hasIPhoneNotch() ? 'intro-modal__close-anchor-iphonex' : ''}`}
              >
                <img src={cordovaDot(closeIcon)} alt="close" />
              </button>
            </div>
            <div key={1}><PollingPlaceLocator /></div>
          </Modal.Body>
        </Modal>
      );
    } else {
      return (
        <div>
          { cordovaOpenSafariView('https://wevote.us/vip.html', this.props.onExit, 50) }
        </div>
      );
    }
  }
}
