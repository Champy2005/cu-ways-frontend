type InlineErrorProps = {
  title?: string;
  message: string;
};

export function InlineError({ title = "Something went wrong", message }: InlineErrorProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900" role="alert">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-red-800">{message}</p>
    </div>
  );
}
