import React, { Component } from 'react'
import Pagination from "react-js-pagination";
export class EnpointsComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            limit: 5,
            offset: 0,
            activePage: 1,
            totalRecord: 0
        }
    }
    onSelectEndpoint = (endpoint) => {
        this.props.selectEndpoint(endpoint)

    }
    async handlePageChange(pageNumber) {
        try {
            this.setState({ activePage: pageNumber });
            let offset = (pageNumber - 1) * this.state.limit
            this.setState({
                offset: offset
            })
            await this.props.getListEndpoints(this.state.limit, offset)
        } catch (err) {
            console.log(err)
        }
    }
    reloadEndpoints() {
        this.setState({ activePage: 1 });
        this.props.getListEndpoints(this.state.limit, 0)
    }
    render() {
        let { endpointsList, enpointSelected, getListEndpoints, loading, totalRecord } = this.props
        return (
            <div className="endpoints">
                <div className="endpoints__title">
                    <div className="endpoints__title-text">Endpoints</div>
                    <button onClick={() => this.reloadEndpoints()} className="endpoints__title-btn">Reload</button>
                </div>
                <div className="endpoints__content">

                    {loading ? <div style={{ color: 'white' }}>loading...</div> : <div>
                        {endpointsList ? endpointsList.map((ele) => (
                            <div
                                onClick={() => this.onSelectEndpoint(ele)}
                                className={enpointSelected.Id === ele.Id ? 'endpoints__content-item endpoints__content-item-active' : 'endpoints__content-item'}
                                key={ele.Id}
                            >

                                <span>{ele.Url} {enpointSelected.Id === ele.Id ? <i className="fa fa-check" aria-hidden="true"></i> : null}</span>
                            </div>
                        )) : null}
                        <div className="paging-table">
                            <Pagination
                                activePage={this.state.activePage}
                                itemsCountPerPage={this.state.limit}
                                totalItemsCount={totalRecord}
                                pageRangeDisplayed={5}
                                onChange={this.handlePageChange.bind(this)}
                                prevPageText={'Prev'}
                                nextPageText={'Next'}
                                firstPageText={'First'}
                                lastPageText={'Last'}

                            />
                        </div>
                    </div>}
                </div>
            </div>

        )
    }
}

export default EnpointsComponent
