/**
 * General utility function to handle API error messages and provide better user feedback
 * Can be used anywhere in the application for consistent error handling
 */
export function getErrorMessage(error: any, defaultMessage: string = "An error occurred"): { message: string; type: 'error' | 'warning' } {
  const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
  
  // Handle specific error cases with better messaging
  // These can be used across different parts of the application
  
  // Permission-related errors
  if (errorMessage.includes("You do not have permission")) {
    return {
      message: "You don't have permission to perform this action. Contact your administrator.",
      type: 'error'
    };
  }
  
  if (errorMessage.includes("Only admin and superadmin")) {
    return {
      message: "You don't have permission to perform this action. Contact your administrator.",
      type: 'error'
    };
  }
  
  // Invitation-specific errors
  if (errorMessage.includes("User already has this role")) {
    return {
      message: "This user already has the selected role.",
      type: 'warning'
    };
  }
  
  if (errorMessage.includes("Active invitation for this email already exists")) {
    return {
      message: "An active invitation for this email already exists. Please wait for it to expire or delete the existing invitation first.",
      type: 'warning'
    };
  }
  
  if (errorMessage.includes("Invitation for this email already exists")) {
    return {
      message: "An invitation for this email already exists. Please check pending invitations.",
      type: 'warning'
    };
  }
  
  // Role management errors
  if (errorMessage.includes("Admin can only invite editor and player roles")) {
    return {
      message: "As an admin, you can only invite editors and players.",
      type: 'error'
    };
  }
  
  if (errorMessage.includes("You cannot revoke your own role")) {
    return {
      message: "You cannot revoke your own role.",
      type: 'warning'
    };
  }
  
  if (errorMessage.includes("Admin can only revoke editor roles")) {
    return {
      message: "As an admin, you can only revoke editor roles.",
      type: 'error'
    };
  }
  
  // Validation errors
  if (errorMessage.includes("All fields are required")) {
    return {
      message: "Please fill in all required fields.",
      type: 'error'
    };
  }
  
  if (errorMessage.includes("Invalid role")) {
    return {
      message: "The selected role is invalid. Please choose a valid role.",
      type: 'error'
    };
  }
  
  // Default case - return original message
  return {
    message: errorMessage,
    type: 'error'
  };
}
