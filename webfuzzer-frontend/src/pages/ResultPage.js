
import Page from 'components/Page';
import {
  Col,
  Row,

} from 'reactstrap';


import React, { Component } from 'react'
import endpoints from '../endpoints'
import callApi from '../apiCaller'
import RequestDetailComponent from '../components/Result/RequestDetailComponent'
import NotificationSystem from 'react-notification-system';
import { NOTIFICATION_SYSTEM_STYLE } from 'utils/constants';
import filter from '../assets/img/filter.svg'
import Pagination from "react-js-pagination";
export default class ResultPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requestList: [],
      loading: false,
      detailId: -1,
      requestDetail: {},
      configs: {},
      isOpenFilter: false,
      filterId: 1,
      types: [
        {
          id: 0,
          type: 'vuln',
          label: 'True'
        },
        {
          id: 1,
          type: 'all',
          label: 'All'
        },

      ],
      disabled: [

      ],
      limit: 10,
      offset: 0,
      activePage: 1,
      totalRecord: 0,
      urlSearch: ''

    };
  }
  componentDidMount = async () => {
    try {
      await this.getListRequest()
      console.log(this.state.totalPage)
      await this.getConfigs()
    } catch (error) {

    }
  }
  getConfigs = async () => {
    try {
      let { results } = await callApi(endpoints.getConfigs, 'get', null)
      this.setState({
        configs: results
      })
    } catch (error) {
      console.log(error)
    }
  }
  getListRequest = async (type = 'all', limit, offset) => {
    try {
      this.setState({
        loading: true
      })
      let { results } = await callApi(endpoints.getTargetList(type, limit, offset), 'get', null)
      if (results && results.total > 0) {
        let { requestInfo } = results;
        if (!type) {
          requestInfo = requestInfo.filter(el => !el.Vulnerable)
        }
        this.setState({
          requestList: requestInfo,
          loading: false,
          totalRecord: results.total

        })
        console.log('##goHere')
      }
    } catch (error) {
      console.log(error)
      this.setState({
        loading: false,
        requestList: []
      })
    }
  }
  getDetailRequest = async (requestId) => {
    try {
      if (this.state.loading) {
        return;
      } else {
        if (requestId == this.state.detailId) {
          this.setState({
            detailId: -1
          })
          return;
        }
        this.setState({
          loading: true
        })
        let { results } = await callApi(endpoints.getTargerDetail(requestId), 'get', null)
        let requestInfo = results.requestInfo;
        if (requestInfo.Result) {
          let { configs } = this.state
          let result = []
          let objectArray = Object.entries(requestInfo.Result)
          objectArray.forEach(([key, value]) => {

            result.push({
              key: configs[key] ? configs[key].label : key,
              value: [...value]
            })
          })

          requestInfo.result = [...result]
          console.log(requestInfo)

        }

        this.setState({
          loading: false,
          requestDetail: requestInfo,
          detailId: requestId
        })

      }
    } catch (error) {
      console.log(error)
    }

  }
  filterList = async (type) => {
    try {
      this.setState({
        filterId: type.id,
        isOpenFilter: false,
        loading: true
      })
      await this.getListRequest(type.type)
      this.setState({
        loading: false
      })
    } catch (error) {
      console.log(error)
    }

  }
  toggleFilter = () => {
    if (this.state.loading) {
      return;
    }
    this.setState({
      isOpenFilter: !this.state.isOpenFilter
    })
  }
  disableExecuteFuzzRequest = (requestId) => {
    let { disabled } = this.state;
    console.log(requestId)
    disabled.push(requestId);

    this.setState({
      disabled: [...disabled]
    })
    console.log(this.state.disabled)
  }
  async handlePageChange(pageNumber) {
    try {
      this.setState({ activePage: pageNumber });
      let offset = (pageNumber - 1) * this.state.limit
      this.setState({
        offset: offset
      })
      if (this.state.urlSearch) {
        await this.searchListRequest(this.state.limit, offset)
        return;
      }
      let type = this.state.types.filter(type => type.id === this.state.filterId)
      await this.getListRequest(type[0].type, this.state.limit, offset)
    } catch (err) {
      console.log(err)
    }
  }
  onSearchSubmit = async (e) => {
    try {
      e.preventDefault()
      if (this.state.urlSearch) {
        await this.searchListRequest(this.state.limit, 0)
      } else {
        await this.getListRequest('all', this.state.limit, 0)
      }
    } catch (error) {
      console.log(error)
    }

  }
  onChangeInput = e => {
    e.preventDefault()
    this.setState({
      urlSearch: e.target.value
    })
  }
  searchListRequest = async (limit, offset) => {
    try {
      this.setState({
        loading: true
      })
      let { results } = await callApi(endpoints.searchTarget(this.state.urlSearch, limit, offset), 'get', null)
      if (results && results.total > 0) {
        let { requestInfo } = results;

        this.setState({
          requestList: requestInfo,
          loading: false,
          totalRecord: results.total

        })
        console.log('##goHere')
      }
    } catch (error) {
      console.log(error)
      this.setState({
        loading: false,
        requestList: []
      })
    }
  }
  render() {
    let { loading, requestList, detailId, requestDetail, configs, types, filterId, isOpenFilter, disabled } = this.state
    return (
      <Page title="Result" >
        <Row>
          <Col cols="12">
            <div className="">
              <div className="search-bar">
                <div>
                  <form onSubmit={(e) => this.onSearchSubmit(e)}>
                    <input placeholder="Enter url" onChange={(event) => this.onChangeInput(event)} />
                    <button type="submit">
                      <i className="fa fa-search" aria-hidden="true"></i>
                    </button>
                  </form>
                </div>
              </div>
              <div className="table-responsive result-wrap">
                <table className="w-100">
                  <thead>
                    <tr>
                      <th>Id request</th>
                      <th className="filter-wrap">
                        Vulnerable
                        <span
                          onClick={() => this.toggleFilter()}
                          className={loading ? 'loading-filter' : ''}
                        >
                          <img src={filter} />
                        </span>
                        {isOpenFilter ? <div className="filter-box">
                          {types.map(el => (
                            <div key={el.id}
                              className={filterId === el.id ? 'filter-item filter-item-active' : 'filter-item'}
                              onClick={() => this.filterList(el)}
                            >
                              {el.label}
                            </div>
                          ))}
                        </div> : ''}
                      </th>
                      <th>
                        Url
                      </th>
                      <th>Status</th>
                      <th>
                        Request timestamp
                      </th>
                      <th></th>
                    </tr>

                  </thead>

                  {(requestList && requestList.length > 0) ? requestList.map(el => (
                    <tbody key={el.IdRequest}>
                      <tr>
                        <td>{el.IdRequest}</td>
                        <td className="vulnerable">
                          {el.Vulnerable ?
                            <div className="checkmark">
                              <div className="checkmark-stem"></div>
                              <div className="checkmark-kick"></div>
                            </div>
                            :
                            <div className="close-icon"></div>
                          }
                        </td>
                        <td style={{ color: "#0d89ff" }}><div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "650px" }}>{el.Url}</div></td>
                        <td>{el.Status}</td>
                        <td>{el.RequestTimestamp}</td>
                        <td className="detail">
                          <div onClick={() => this.getDetailRequest(el.IdRequest)}>Detail</div>
                        </td>
                      </tr>
                      {el.IdRequest == detailId ?
                        (<tr>
                          <td colSpan="6">
                            <RequestDetailComponent
                              baseRequest={JSON.stringify(requestDetail.BaseRequest)}
                              resultTimestamp={requestDetail.ResultTimestamp}
                              vulnTypes={requestDetail.VulnTypes ? requestDetail.VulnTypes.vulnTypes : null}
                              strategy={requestDetail.Strategy}
                              result={requestDetail.result}
                              configs={configs}
                              requestId={requestDetail.IdRequest}
                              disabled={disabled}
                              disableExecuteFuzzRequest={this.disableExecuteFuzzRequest}
                              status={el.Status}
                              idEndpoint={el.IdEndpoint}
                            />
                          </td>
                        </tr>)
                        : null}
                    </tbody>
                  )) : null}


                </table>
              </div>
              <div className="paging-table">
                <Pagination
                  activePage={this.state.activePage}
                  itemsCountPerPage={this.state.limit}
                  totalItemsCount={this.state.totalRecord}
                  pageRangeDisplayed={5}
                  onChange={this.handlePageChange.bind(this)}
                  prevPageText={'Prev'}
                  nextPageText={'Next'}
                  firstPageText={'First'}
                  lastPageText={'Last'}

                />
              </div>
            </div>

          </Col>
        </Row>

      </Page>
    )
  }
}

