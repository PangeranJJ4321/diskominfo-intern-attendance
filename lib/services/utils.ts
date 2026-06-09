// Helper for parsing errors
export async function handleError(res: Response, defaultMessage: string) {
  const errorData = await res.json().catch(() => ({}));
  throw new Error(errorData.error || defaultMessage);
}
