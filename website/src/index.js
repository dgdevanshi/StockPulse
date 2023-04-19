import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import './style.css'
import Home from './views/home'
import Results from './views/results'

const App = () => {
  return (
    <Router>
      <div>
      <Route component={Home} exact path="/home" />
      <Route component={Results}  path="/" />
      </div>
    </Router>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))