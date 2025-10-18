import { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 这里可以添加错误上报逻辑
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 模拟错误上报到监控服务
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 在实际应用中，这里会发送到错误监控服务（如 Sentry）
    console.log('Error report:', errorReport);
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 自定义的错误UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">出现了一些问题</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                很抱歉，应用遇到了意外错误。我们已经记录了这个问题，将尽快修复。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted/50 rounded-lg p-3">
                  <summary className="text-sm font-medium cursor-pointer">
                    错误详情 (开发环境)
                  </summary>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium">错误信息:</p>
                    <p className="mb-2">{this.state.error.message}</p>
                    <p className="font-medium">错误堆栈:</p>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新尝试
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  刷新页面
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook版本的错误边界（用于函数组件内部错误处理）
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('useErrorHandler caught an error:', error, errorInfo);
    
    // 可以在这里添加错误上报逻辑
    // 或者显示 toast 通知等
  };

  return { handleError };
};