"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ModelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ModelErrorBoundary] 3D model failed to load:", error.message);
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}
