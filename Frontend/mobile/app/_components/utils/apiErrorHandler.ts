export function handleApiError(error: any): Error {
  if (error.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  if (error.response?.data?.error) {
    return new Error(error.response.data.error);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unknown error occurred');
}
