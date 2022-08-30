import React from 'react'


export default class ConfigPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            upr_schedule: props.schedule,
            upr_amp: props.amp
        };
    }
    render() {
        return (
            <div className="allsuggestionspanel">
                {this.state.upr_schedule ? <Breakes/> : null}
                {this.props.schedule}
                {this.state.upr_schedule}
            </div>
        );
    }
};

class Breakes extends React.Component {
    render() {
        return (
            <div>
                test
            </div>
        );
    }
};