export const sanitizeError = (error) => {
  // Log technical details for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.group('🐛 Technical Error Details (Dev Only)');
    console.error('Original error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.groupEnd();
  }

  // Return user-friendly message
  return getUserFriendlyMessage(error);
};

const getUserFriendlyMessage = (error) => {
  if (!error) return null;

  const errorString = error.toString().toLowerCase();
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';

  // Specific MetaMask error codes
  switch (errorCode) {
    case 4001:
      return "Connection cancelled. Please try again when you're ready!";
    case -32002:
      return 'Please check MetaMask for a pending connection request.';
    case -32603:
      return 'MetaMask encountered an issue. Please restart MetaMask and try again.';
    case 4100:
      return 'This feature is not supported by your wallet.';
    case 4200:
      return 'Your wallet is not connected to the right network.';
    case 4900:
      return 'Your wallet is disconnected. Please reconnect.';
    case 4901:
      return "Your wallet doesn't support this network.";
  }

  // Pattern-based error handling
  const errorPatterns = {
    // Connection issues
    'failed to connect':
      'Unable to connect to MetaMask. Please check that MetaMask is unlocked and try again.',
    'connection timeout':
      'Connection timed out. Please unlock MetaMask and try again.',
    'user rejected':
      'Connection cancelled. Please approve the connection in MetaMask.',
    'user denied':
      'Permission denied. Please allow access in MetaMask to continue.',
    'request already pending': 'Please check MetaMask for a pending request.',

    // Network issues
    'wrong network': 'Please switch to the correct network in MetaMask.',
    'unsupported network':
      'This network is not supported. Please switch to a supported network.',
    'network error':
      'Network connection issue. Please check your internet connection.',
    'provider not found':
      'Wallet not detected. Please install and unlock MetaMask.',

    // Transaction issues
    'insufficient funds':
      'Insufficient funds for this transaction. Please add more ETH to your wallet.',
    'gas required exceeds allowance':
      'Transaction fee too high. Please try again or increase your gas limit.',
    'transaction underpriced':
      'Transaction fee too low. Please increase the gas price.',
    'nonce too low':
      'Transaction conflict. Please reset your account or try again.',
    'transaction failed': 'Transaction failed. Please try again.',

    // Account issues
    'no accounts':
      'No wallet accounts available. Please connect an account in MetaMask.',
    'account not found':
      'Wallet account not accessible. Please reconnect your wallet.',
    unauthorized: 'Access denied. Please connect your wallet first.',

    // Contract issues
    'contract not deployed':
      'Game contract not available. Please try again later.',
    'contract execution reverted':
      'Transaction failed due to contract restrictions.',
    'method not found': 'This action is not available right now.',

    // General patterns
    timeout: 'Request timed out. Please try again.',
    cancelled: 'Action cancelled. You can try again anytime.',
    rejected: 'Request rejected. Please try again and approve the action.',
    'not available':
      'This feature is currently unavailable. Please try again later.',
    'internal error':
      'Something went wrong on our end. Please try again in a moment.',
  };

  // Check for pattern matches
  for (const [pattern, message] of Object.entries(errorPatterns)) {
    if (errorString.includes(pattern) || errorMessage.includes(pattern)) {
      return message;
    }
  }

  // Special handling for specific error scenarios
  if (errorString.includes('metamask') && errorString.includes('install')) {
    return 'MetaMask wallet is required to play. Please install MetaMask and refresh the page.';
  }

  if (errorString.includes('unlock') || errorString.includes('locked')) {
    return 'Please unlock your MetaMask wallet and try again.';
  }

  if (errorString.includes('switch') && errorString.includes('network')) {
    return 'Please switch to the correct network in MetaMask and try again.';
  }

  // Ultimate fallback - generic but helpful
  return 'Something went wrong. Please check MetaMask and try again.';
};

// 🎯 SPECIFIC ERROR HANDLERS FOR DIFFERENT CONTEXTS

export const handleWalletConnectionError = (error) => {
  const friendlyMessage = sanitizeError(error);

  return {
    title: 'Wallet Connection Issue',
    message: friendlyMessage,
    action: 'Try connecting again',
    severity: 'warning', // info, warning, error
    autoHide: error.code === 4001, // Hide automatically if user cancelled
  };
};

export const handleTransactionError = (error) => {
  const friendlyMessage = sanitizeError(error);

  return {
    title: 'Transaction Failed',
    message: friendlyMessage,
    action: 'Try again',
    severity: 'error',
    autoHide: false,
  };
};

export const handlePackOpeningError = (error) => {
  const friendlyMessage = sanitizeError(error);

  return {
    title: 'Pack Opening Failed',
    message: friendlyMessage,
    action: 'Try opening again',
    severity: 'error',
    autoHide: false,
  };
};

// 📱 TOAST/NOTIFICATION HELPERS

export const showUserFriendlyError = (error, context = 'general') => {
  let errorInfo;

  switch (context) {
    case 'wallet':
      errorInfo = handleWalletConnectionError(error);
      break;
    case 'transaction':
      errorInfo = handleTransactionError(error);
      break;
    case 'pack':
      errorInfo = handlePackOpeningError(error);
      break;
    default:
      errorInfo = {
        title: 'Oops!',
        message: sanitizeError(error),
        action: 'Please try again',
        severity: 'warning',
        autoHide: true,
      };
  }

  // You can integrate this with your notification system
  // For example, if using react-hot-toast:
  // toast.error(errorInfo.message);

  return errorInfo;
};

// 🔧 DEVELOPMENT HELPERS

export const isMetaMaskError = (error) => {
  return (
    error?.code !== undefined ||
    error?.message?.includes('MetaMask') ||
    error?.message?.includes('ethereum')
  );
};

export const shouldLogError = (error) => {
  // Don't log user cancellations as errors
  const ignoreCodes = [4001]; // User rejected
  return !ignoreCodes.includes(error?.code);
};

// 📊 ERROR ANALYTICS (Optional)

export const trackError = (error, context) => {
  if (process.env.NODE_ENV === 'production' && shouldLogError(error)) {
    // You could send this to your analytics service
    // analytics.track('Error Occurred', {
    //   context: context,
    //   errorCode: error.code,
    //   errorType: error.name,
    //   userAgent: navigator.userAgent,
    //   timestamp: new Date().toISOString()
    // });

    console.warn(`Error tracked: ${context}`, {
      code: error.code,
      name: error.name,
      sanitized: sanitizeError(error),
    });
  }
};
