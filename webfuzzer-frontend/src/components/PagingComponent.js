import React, { Component } from 'react'

export default class PagingComponent extends Component {
    state = {
        listPages: []
    }
    componentDidMount = () => {
        this.getListPage()
    }
    componentDidUpdate = (prevProps) => {
        if (this.props.totalPage !== prevProps.totalPage) {
            this.getListPage()
        }
    }
    getListPage = () => {
        let { totalPage } = this.props;
        let listPages = []
        for (let i = 1; i <= totalPage; i++) {
            listPages.push(i)
        }
        this.setState({
            listPages: listPages
        })
    }
    render() {
        let { listPages } = this.state
        return (
            <div className="paging-component">
                {listPages ? listPages.map(page => (
                    <button key={page} className="page">{page}</button>
                )) : ''}
            </div>
        )
    }
}
