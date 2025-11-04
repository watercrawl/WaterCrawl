export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-warning-light text-warning-dark';
    case 'completed':
      return 'bg-success-light text-success-dark';
    case 'failed':
      return 'bg-error-light text-error';
    default:
      return 'bg-muted text-foreground';
  }
};
