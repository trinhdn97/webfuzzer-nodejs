
import Page from 'components/Page';
import React from 'react';
import EndpointsComponent from 'components/Dashboard/EndpointsComponent'
import BaseRequestComponent from 'components/Dashboard/BaseRequestComponent'
import ListVulnes from 'components/Dashboard/ListVulnesComponent'
import AwaitingComponent from 'components/AwaitingComponent'
import {
  Col,
  Row,
} from 'reactstrap';
import endpoints from '../endpoints'
import callApi from '../apiCaller'
import NotificationSystem from 'react-notification-system';
import { NOTIFICATION_SYSTEM_STYLE } from 'utils/constants';
class DashboardPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      endpointsList: [],
      vulneTypes: [


      ],
      endpointSelected: {},
      loading: false,
      loadingSubmit: false,
      checkedAllAutoFuzz: false,
      totalRecord: 0

    };
  }
  componentDidMount = async () => {
    let apiList = [this.getListEndpoints(), this.getVulneTypes()]
    let [
      res1,
      res2
    ] = await Promise.all(apiList);
  }
  getListEndpoints = async (limit = 5, offset = 0) => {
    try {
      this.setState({
        loading: true,
        endpointSelected: {}
      })
      let endpointList = await callApi(endpoints.getAllEndpoinst(limit, offset), 'get', null)
      if (endpointList && endpointList.results) {
        let list = endpointList.results.endpointList
        console.log(list, 'list')

        this.setState({
          endpointsList: list,
          totalRecord: endpointList.results.total
        })
        setTimeout(() => {
          this.setState({
            loading: false
          })
        }, 1000)
        // this.selectEndpoint(this.state.endpointsList[0])
      }


    }
    catch (err) {
      this.setState({
        loading: false
      })
      console.log(err)
    }
  }
  selectEndpoint = (endpoint) => {
    if (!this.state.endpointSelected.Id) {
      this.setState({
        endpointSelected: { ...endpoint }
      })
    } else {
      if (this.state.endpointSelected.Id !== endpoint.Id) {
        this.setState({
          endpointSelected: { ...endpoint }
        })
      }
    }
  }
  selectVulne = (item) => {
    if (item.check && item.id !== 6) {
      this.setState({
        checkedAllAutoFuzz: false
      })
    }
    let { vulneTypes } = this.state;
    vulneTypes.map((ele) => {
      if (ele.id === item.id) {
        ele.check = !ele.check
      }
      return ele
    })
    this.setState({
      vulneTypes: vulneTypes
    })
    let isCheckAllAuto = this.verifyCheckAllAuto(this.state.vulneTypes)
    let listFilter = this.state.vulneTypes.filter(ele => ele.type === 'auto')
    if (isCheckAllAuto === listFilter.length) {
      this.setState({
        checkedAllAutoFuzz: true
      })
    }
  }
  getVulneTypes = async () => {
    try {
      let { results } = await callApi(endpoints.getListVulnes, 'get', null)
      let arr = []
      if (results) {
        Object.keys(results).forEach((key, idx) => {
          console.log(key, '##key')
          let vulne = {
            id: String(key),
            label: results[key].label,
            check: false,
            type: key === '6' ? 'common' : 'auto'
          }
          arr.push(vulne)
        })
      }
      this.setState({
        vulneTypes: [...arr]
      })
      console.log(arr, '##arr')

    } catch (err) {
      console.log(err)
    }
  }
  verifyCheckAllAuto(list) {
    if (!list || !list.length > 0) {
      return 0
    }
    let listFilter = list.filter(ele => ele.type === 'auto')
    let sum = 0;
    for (let i = 0; i < listFilter.length; i++) {
      if (listFilter[i].check) {
        sum++
      }
    }
    return sum
  }
  toogleAllAutoFuzz = () => {
    let vulneTypes = [...this.state.vulneTypes];
    let listFilter = this.state.vulneTypes.filter(ele => ele.type === 'auto')
    for (let i = 0; i < listFilter.length; i++) {
      if (!this.state.checkedAllAutoFuzz) {
        listFilter[i].check = true

      } else {
        listFilter[i].check = false
      }
      vulneTypes[i] = { ...listFilter[i] }
    }

    this.setState({
      vulneTypes: vulneTypes,
      checkedAllAutoFuzz: !this.state.checkedAllAutoFuzz
    })
  }

  submitFuzzRequest = async () => {
    try {
      if (!this.state.endpointSelected.Id) {
        return;
      } else {
        this.setState({
          loadingSubmit: true
        })
        let vulneTypes = this.getSelectedVulneTypes()
        let vulnTypes = {
          vulnTypes: vulneTypes
        }
        vulnTypes = JSON.stringify(vulnTypes)
        console.log(vulnTypes, '##vulType')
        let params = {
          targetId: this.state.endpointSelected.Id,
          vulnTypes: vulnTypes
        }
        let { results } = await callApi(endpoints.createFuzzRequest, 'post', params)
        if (results && results.requestId) {
          setTimeout(() => {
            this.setState({
              endpointSelected: {},
              loadingSubmit: false
            })
            this.unCheckAllVulnTypes()
            if (!this.notificationSystem) {
              return;
            }

            this.notificationSystem.addNotification({
              message: 'Send fuzz request successfully',
              level: 'success',
              position: 'tc'
            });
          }, 1500)
        } else {
          setTimeout(() => {
            this.setState({
              endpointSelected: {},
              loadingSubmit: false
            })
            this.unCheckAllVulnTypes()
            if (!this.notificationSystem) {
              return;
            }

            this.notificationSystem.addNotification({
              message: 'Some things went wrong',
              level: 'error',
              position: 'tc'
            });
          }, 1500)
        }



      }
    } catch (err) {
      console.log(err)
      setTimeout(() => {
        this.setState({
          endpointSelected: {},
          loadingSubmit: false
        })
        this.unCheckAllVulnTypes()
        if (!this.notificationSystem) {
          return;
        }

        this.notificationSystem.addNotification({
          message: 'Some things went wrong',
          level: 'error',
          position: 'tc'
        });
      }, 1500)
    }
  }
  getSelectedVulneTypes = () => {
    let vulTypes = [...this.state.vulneTypes];
    let result = [];
    for (let i = 0; i < vulTypes.length; i++) {
      if (vulTypes[i].check) {
        result.push(vulTypes[i].id)
      }
    }
    return result
  }
  unCheckAllVulnTypes = () => {
    let vulTypes = [...this.state.vulneTypes];
    for (let i = 0; i < vulTypes.length; i++) {
      vulTypes[i].check = false
    }
    this.setState({
      vulneTypes: vulTypes,
      checkedAllAutoFuzz: false
    })
  }
  render() {

    return (
      <Page
        className="DashboardPage"
        title="Dashboard"
      >

        <Row>
          <Col lg="4">
            <EndpointsComponent
              endpointsList={this.state.endpointsList}
              selectEndpoint={this.selectEndpoint}
              endpointSelected={this.state.endpointSelected}
              getListEndpoints={this.getListEndpoints}
              loading={this.state.loading}
              totalRecord={this.state.totalRecord}
            />
          </Col>

          <Col lg="8">
            <BaseRequestComponent selectedEndpoint={this.state.endpointSelected} />
          </Col>
        </Row>
        <Row>
          <Col lg="4">
            <ListVulnes
              listVulnes={this.state.vulneTypes}
              selectVulne={this.selectVulne}
              checkedAllAutoFuzz={this.state.checkedAllAutoFuzz}
              toogleAllAutoFuzz={this.toogleAllAutoFuzz}
            />
            <div className="btn-submit">

              {this.state.loadingSubmit ?
                <AwaitingComponent /> :
                <button
                  disabled={!this.state.endpointSelected.Id}
                  onClick={() => this.submitFuzzRequest()}>Create fuzz request
              </button>}
            </div>
          </Col>

          <Col lg="8">

          </Col>
        </Row>
        <NotificationSystem
          dismissible={false}
          ref={notificationSystem =>
            (this.notificationSystem = notificationSystem)
          }
          style={NOTIFICATION_SYSTEM_STYLE}
        />
      </Page>
    );
  }
}
export default DashboardPage;
