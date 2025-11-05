export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-warning-soft text-warning-strong';
    case 'completed':
      return 'bg-success-soft text-success-strong';
    case 'failed':
      return 'bg-error-soft text-error';
    default:
      return 'bg-muted text-foreground';
  }
};
