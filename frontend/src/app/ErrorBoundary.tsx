import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

type Props = { children: ReactNode };
type State = { hasError: boolean };
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('CampusHub UI error', error, info); }
  render() {
    if (this.state.hasError) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950"><div className="max-w-md text-center"><AlertTriangle className="mx-auto size-9 text-amber-500" /><h1 className="mt-4 text-xl font-bold">Something went wrong</h1><p className="mt-2 text-sm text-slate-500">The page encountered an unexpected error.</p><Button className="mt-5" onClick={() => window.location.reload()}>Reload page</Button></div></div>;
    return this.props.children;
  }
}
