interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'No data found.' }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
