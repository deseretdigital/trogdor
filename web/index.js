/** @jsx React.DOM */

var React = require('react');
var jQuery = require('jquery2');

var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var BranchStore = require('./lib/stores/BranchStore');


var App = React.createClass({
    render: function() {
        return (
            <div id={"layout"}>
                <a href="#menu" id="menuLink" class="menu-link">
                {/* <!-- Hamburger icon --> */}
                    <span></span>
                </a>

                <div id={'menu'}>
                    <div className={'pure-menu pure-menu-open'}>
                        <a className="pure-menu-heading" href="#">Trogdor</a>
                        <ul>
                            <li><a href="#">Home</a></li>
                            <li><a href="#">About</a></li>
                            <li className="menu-item-divided pure-menu-selected">
                                <a href="#">Services</a>
                            </li>

                            <li><a href="#">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div id="main">
                    {/* this is the important part */}
                    <this.props.activeRouteHandler/>
                </div>
            </div>
        );
    }
});

var Dashboard = React.createClass({
    render: function() {
        return (
            <div className="header">
                <h1>Trogdor Status: </h1>
                <h2>A subtitle for your page goes here</h2>
            </div>
        );
    }
});

var routes = (
    <Routes location="history">
        <Route name="app" path="/" handler={App}>
        {/* <Route name="inbox" handler={Inbox}/>
            <Route name="calendar" handler={Calendar}/> */}
            <DefaultRoute handler={Dashboard}/>
        </Route>
    </Routes>
);



jQuery(document).ready(function(){
    React.render(routes, document.getElementById('app'));

    /* Load Data */
    console.log("Calling BRanch Store");
    BranchStore.loadAllBranches();
});

