import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo: JSON.stringify(errorInfo) });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isFirebaseError = this.state.error?.message.includes('{"error":');
      let displayMessage = "An unexpected error occurred.";
      let details = null;

      if (isFirebaseError) {
        try {
          const info = JSON.parse(this.state.error!.message);
          displayMessage = `Security Error: ${info.error}`;
          details = `Operation: ${info.operationType} on ${info.path}`;
        } catch (e) {
          displayMessage = "Database access denied.";
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
          <Card className="max-w-md w-full border-destructive/20 shadow-2xl shadow-destructive/10">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-neutral-600">{displayMessage}</p>
                {details && <p className="text-xs text-muted-foreground font-mono bg-neutral-100 p-2 rounded">{details}</p>}
              </div>
              
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
              
              <p className="text-[10px] text-neutral-400">
                If this persists, please contact support with your User ID.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
