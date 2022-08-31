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
            </div>
        );
    }
};

class Breakes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fetched: false,
            data: []
        }
    }

    get_data = async () => {
        const r = await fetch('/api/playlist/weekdays', {
            method: 'GET',
        });
        if (r.ok) {
            this.setState({ data: JSON.parse(await r.text()) });
        } else {
            console.log(await r.text());
        }

        const r2 = await fetch('/api/playlist/breaktimes', {
            method: 'GET',
        });
        if (r2.ok) {
            this.setState({ fetched: true, presets: JSON.parse(await r2.text()) });
        } else {
            console.log(await r2.text());
        }

    }

    componentDidMount() {
        this.get_data();
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        let changed = false;
        for (let i = 0; i < 7; i++) {
            let weekday = (i + 1) % 7;
            let data = {
                weekday: weekday,
                isEnabled: event.target.elements[i + "_enabled"].checked,
                breaktimeid: parseInt(event.target.elements[i + "breaktime"].value),
                visibility: parseInt(event.target.elements[i + "_visibility"].value)
            }
            if (data.isEnabled !== this.state.data[weekday].isEnabled
                || !this.state.data[weekday].breaketime
                || data.breaktimeid !== this.state.data[weekday].breaketime.id 
                || data.visibility !== this.state.data[weekday].visibility) {
                // need to send data to sever
                const r = await fetch('/api/playlist/schedule', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                if (r.ok) {
                    changed = true;

                } else {
                    console.log(await r.text());
                }
            }
        }
        if (changed) {
            // somehow refresh playlist 
        }
    }

    render() {
        const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
        let toRender = [];
        if (this.state.fetched) {
            this.state.presets.forEach(test = (item,index) => {toRender.push(item)})
                let weekday = (i + 1) % 7; // js bad, sunday is 0
                
        }
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    {toRender}
                    <button type="submit">potwierdź</button>
                </form>
            </div>
        )
    }
}