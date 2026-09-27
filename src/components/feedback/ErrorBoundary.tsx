import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0914] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#26143E]/60 border border-[#8B44F7]/30 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#E2B86E]">¡Ups! Ocurrió un inconveniente</h2>
            <p className="text-sm text-gray-300">
              {this.state.error?.message || 'Un error inesperado ocurrió en la interfaz.'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Recargar Aplicación
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
