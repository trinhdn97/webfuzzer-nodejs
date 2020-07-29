import React, { Component } from 'react'
import { Collapse } from 'reactstrap';
import endpoints from '../../endpoints'
import callApi from '../../apiCaller'
import NotificationSystem from 'react-notification-system';
import { NOTIFICATION_SYSTEM_STYLE } from 'utils/constants';
export default class RequestDetailComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,

        };
    }
    toggleResult = () => {
        this.setState({
            open: !this.state.open
        })
    }
    checkDisableButton = (requestId) => {
        let { disabled } = this.props
        console.log(disabled)
        console.log(requestId, '##id')
        let filter = disabled.filter(el => el === requestId)
        if (filter && filter.length > 0) {
            return true
        }
        return false
    }
    executeFuzzRequest = async () => {
        try {
            console.log(this.props.requestId)
            let results = await callApi(endpoints.executeFuzzRequest(this.props.requestId), 'get', null)
            this.props.disableExecuteFuzzRequest(this.props.requestId)
            if (results) {
                if (!this.notificationSystem) {
                    return;
                }
                this.notificationSystem.addNotification({
                    message: 'Execute fuzz request successfully',
                    level: 'success',
                    position: 'tc'
                });
            } else {
                if (!this.notificationSystem) {
                    return;
                }
                this.notificationSystem.addNotification({
                    message: 'Fuzz request has already been executed!',
                    level: 'error',
                    position: 'tc'
                });
            }
        } catch (error) {
            console.log(error, ' ##error')
            if (!this.notificationSystem) {
                return;
            }
            this.notificationSystem.addNotification({
                message: 'Error',
                level: 'error',
                position: 'tc'
            });
        }
    }
    render() {
        let { baseRequest, resultTimestamp, vulnTypes, strategy, result, configs, requestId, status, idEndpoint } = this.props
        return (
            <div className="detail-request">
                <div className="detail-header">Request detail</div>
                <div className="detail-content">
                    <div className="detail-item">
                        <div className="detail-item-title">Id Endpoint</div>
                        <div className="detail-item-content">{idEndpoint}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-item-title">Strategy</div>
                        <div className="detail-item-content">{strategy}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-item-title">Base request</div>
                        <div className="detail-item-content"><pre className="base-request">{JSON.stringify(JSON.parse(baseRequest), null, 2).replace(/\\\\xa7/gi, '§')}</pre></div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-item-title">Vulnerability types</div>
                        <div className="detail-item-content">
                            {vulnTypes ? vulnTypes.map(type => (
                                <div key={type} >{configs[type] ? configs[type].label : ''}</div>
                            )) : null}
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-item-title">Results</div>
                        <div className="detail-item-content">
                            {result ? result.map(element =>
                                <div key={element.key}>
                                    <div className="content-dflex">

                                        <div>{element.key}</div>
                                        <div onClick={() => this.toggleResult()} className="show-payload"> Show payload </div>
                                    </div>
                                    <Collapse isOpen={this.state.open}>
                                        <div className="result-content">
                                            <div className="result-content-item-title">Payload</div>
                                            {element.value ? element.value.map((item, idx) => (
                                                <div key={idx} className="result-content-item">
                                                    <div className="result-content-item-content">{item.payload}
                                                        <span style={{ marginLeft: '3rem' }} >
                                                            {item.timebased ? 'Timebased: true' : null}
                                                        </span>
                                                        <span style={{ marginLeft: '3rem' }} >
                                                            {item.matchList.length > 0 ? 'Match: ' + item.matchList.toString() : null}
                                                        </span>
                                                    </div>
                                                </div>
                                            )) : ''}
                                        </div>
                                    </Collapse>

                                </div>
                            ) : 'This endpoint is not vulnerable.'}
                        </div>
                    </div>
                    {resultTimestamp ? <div className="detail-item">
                        <div className="detail-item-title">Result timestamp</div>
                        <div className="detail-item-content">
                            {resultTimestamp}
                        </div>
                    </div> : null}
                    <div className="detail-item">
                        <button disabled={this.checkDisableButton(requestId)} onClick={async () => this.executeFuzzRequest()}>{status == 'Completed' || status == 'Processing' ? 'Re-execute' : 'Execute'} fuzz request</button>
                    </div>
                </div>
                <NotificationSystem
                    dismissible={false}
                    ref={notificationSystem =>
                        (this.notificationSystem = notificationSystem)
                    }
                    style={NOTIFICATION_SYSTEM_STYLE}
                />
            </div>
        )
    }
}
