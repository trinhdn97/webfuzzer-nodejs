import React, { Component } from 'react'

export class BaseRequestComponent extends Component {

    render() {
        let { selectedEndpoint } = this.props

        return (
            <div style={{ height: "100%" }}><pre className="base-request">
                {selectedEndpoint && selectedEndpoint.BaseRequest ? (JSON.stringify(selectedEndpoint.BaseRequest, null, 2).replace(/\\\\xa7/gi, '§')) : null}
            </pre></div>
        )
    }
}

export default BaseRequestComponent
