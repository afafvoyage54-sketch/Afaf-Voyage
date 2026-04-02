import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Oups ! Quelque chose s'est mal passé.</h1>
              <p className="text-sm text-gray-500">
                Une erreur inattendue est survenue. Notre équipe a été notifiée.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-gray-50 p-4 rounded-xl text-left overflow-hidden">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-1">Détails de l'erreur</p>
                <p className="text-xs font-mono text-red-500 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
            >
              <RefreshCcw size={18} />
              Actualiser la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
