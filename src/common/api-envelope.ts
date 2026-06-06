export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export function successEnvelope<T>(data: T): ApiEnvelope<T> {
  return { success: true, data };
}
