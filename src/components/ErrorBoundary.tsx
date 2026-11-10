import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useT } from '../i18n';
import { trackEvent } from '../telemetry';

function CrashScreen() {
  const t = useT();
  return (
    <div className="menu mp-offline" role="alert">
      <h2>{t.common.crashTitle}</h2>
      <p className="hint">{t.common.crashBody}</p>
      <button type="button" className="menu-auth-btn" onClick={() => window.location.reload()}>
        {t.common.crashReload}
      </button>
    </div>
  );
}

// Without this, any render error unmounts the whole tree and the player is
// left on a blank screen with no way back except killing the app.
export class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
    // Error name + first stack frame only: messages can carry user data.
    const frame = (error.stack ?? '').split('\n').find((l) => l.includes('at ')) ?? '';
    trackEvent('app_crash', { error: error.name, frame: frame.trim() });
  }

  render() {
    return this.state.crashed ? <CrashScreen /> : this.props.children;
  }
}
