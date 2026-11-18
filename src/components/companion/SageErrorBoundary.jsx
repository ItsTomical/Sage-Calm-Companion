import { Component } from 'react'

// If the 3D Sage can't be drawn (WebGL lost, the model failed to download),
// show the fallback instead. Without this, one failed canvas would take the
// whole app down with it.
export default class SageErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
