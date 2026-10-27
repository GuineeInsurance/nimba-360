export type Account = { uid: string; displayName: string | null; email: string | null; phoneNumber: string | null; photoURL: string | null };
export type PhoneConfirmation = { confirm: (code: string) => Promise<unknown> };
export type CloudRecord = { id: string; data: Record<string, unknown> };
export type Failure = (error: Error) => void;
