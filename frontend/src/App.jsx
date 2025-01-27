import LoginPage from "./components/old/Login.jsx";
import Suggestions from "./components/old/Suggestion.jsx";
import Breakes from "./components/old/Playlist.jsx"
import BreaksInput from "./components/old/Breaketime.jsx";
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Navbar from "./components/Navbar.jsx";
import Weekdays from "./components/old/Schedule.jsx";
import Footer from "./components/Footer.jsx";
import React from "react";
import Logout from "./components/old/Logout.jsx";
import Amp from "./components/old/Amp.jsx";
import Library from "./components/old/Library.jsx";
import AddSong from "./components/old/AddSong.jsx";
import Users from "./components/old/Users.jsx";
import ConfigPanel from "./components/new/Config.jsx";
import useWindowDimensions from './components/new/sizefunc.jsx';

const Styls = () => {
    const { height, width } = useWindowDimensions();
    var heightz=height-110;
    var heights= ''+heightz
    return (
        <style>
            {".content{\nheight:"+heights+"px;\n}"}
        </style>
    );
};

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			permissions: 0,
			notification: ""
		}
	}
	timeout = undefined;
	
	componentDidMount() {
		this.get_permissions();
	}

	permissions =  {
		suggestions: 0,
		playlist: 1,
		schedule: 2,
		amp: 3,
		library: 4,
		users: 5
	}

	can = (what, permissions) => {
		return Boolean(permissions & (1 << what));
	}

	get_permissions = async () => {
		const r = await fetch("/api/users/permissions");
		if (r.ok) {
			const permissions = JSON.parse(await r.text());
			this.setState({ permissions: permissions.permissions });
		} else {
			this.setState({ permissions: 0 });
		}
	}

	loggedIn = () => {
		this.get_permissions();
	}

	loggedOut = () => {
		this.setState({permissions: 0});
	}

	/*playTest = () => {
		fetch("/api/playlist/play", {
			method: "PUT",
			headers: {
                'Content-Type': 'application/json'
            },
			body: JSON.stringify({
				id: 3
			})});
	}*/

	showNotification = (message, time) => {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.setState({notification: message});
		this.timeout =  setTimeout(() => {
			this.setState({notification: ""});
		}, time);
	}

	render() {
		return (
			<Router>
				<Styls/>
				<div className="App">
					<Navbar notification={this.state.notification} onLogout={this.loggedOut} logged={this.state.permissions} schedule={this.can(this.permissions.schedule, this.state.permissions)} library={this.can(this.permissions.library, this.state.permissions)}/>
					<Switch>
						<Route exact path="/">
						<Redirect to="/playlist" />
						</Route>
						<Route exact path="/old">
							{this.can(this.permissions.schedule, this.state.permissions) ? <BreaksInput breaktimes={[]} admin={this.state.admin} /> : null }
							{this.state.permissions ? <Logout logout={this.loggedOut}/> : <LoginPage loggedIn={this.loggedIn} /> }
							{this.can(this.permissions.schedule, this.state.permissions) ? <Weekdays /> : null}
							{this.can(this.permissions.amp, this.state.permissions) ? <Amp/> : null}
						</Route>
						<Route exact path="/playlist">
							<Breakes sendNotification={this.showNotification} admin={this.can(this.permissions.playlist, this.state.permissions)}/>
						</Route>
						<Route exact path="/suggestions">
							<Suggestions sendNotification={this.showNotification} admin={this.can(this.permissions.suggestions, this.state.permissions)} />
						</Route>
						<Route exact path="/new">
							<ConfigPanel amp={this.can(this.permissions.amp, this.state.permissions)} schedule={this.can(this.permissions.schedule, this.state.permissions)} />
						</Route>
						{this.can(this.permissions.library, this.state.permissions) ? <Route exact path="/library"> <Library sendNotification={this.showNotification}/></Route> : null}
						{this.can(this.permissions.library, this.state.permissions) ? <Route exact path="/addsong"> <AddSong sendNotification={this.showNotification}/></Route> : null}
						{this.state.permissions ? <Route exact path="/users"> <Users admin={this.can(this.permissions.users, this.state.permissions)} sendNotification={this.showNotification}/></Route> : null}
					</Switch>
					<Footer admin={this.can(this.permissions.library, this.state.permissions)}/>
				</div>
			</Router>
		);
	}
}

