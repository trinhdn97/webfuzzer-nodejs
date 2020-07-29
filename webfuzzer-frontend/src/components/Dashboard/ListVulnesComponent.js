import React, { Component } from 'react'

export class ListVulnesComponent extends Component {
    render() {
        let { listVulnes, selectVulne, checkedAllAutoFuzz, toogleAllAutoFuzz } = this.props
        return (
            <div className="list-vulnes">
                <div className="list-vulnes__title">Vulnerability types</div>
                <div className="list-vulnes__auto-fuzz">
                    <div className="fuzz-title">Auto Fuzz</div>
                    <div className="custom-checkbox select-all" onClick={() => toogleAllAutoFuzz()} >
                        Select all auto fuzz
                            <span className={checkedAllAutoFuzz ? 'checked checkmark' : 'checkmark'} ></span>

                    </div>
                </div>
                {listVulnes ? listVulnes.map((ele) => (
                    <div key={ele.id}>
                        {ele.type === 'common' ? <div className="fuzz-title common">Common Fuzz</div> : null}
                        <div className="custom-checkbox" onClick={() => selectVulne(ele)} >
                            {ele.label}
                            <span className={ele.check ? 'checked checkmark' : 'checkmark'} ></span>

                        </div>
                    </div>

                )) : ''}

            </div>
        )
    }
}

export default ListVulnesComponent
