import { ChatGPTSession, CodexConnection } from '../types/connection';

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function convertSessionToCodex(session: ChatGPTSession, priority: number = 1): CodexConnection {
  const now = new Date();
  const expiresIn = 864000; // 10 ngày tính bằng giây
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  return {
    accessToken: session.accessToken || '',
    refreshToken: session.sessionToken || '',
    expiresAt: expiresAt.toISOString(),
    testStatus: 'active',
    expiresIn,
    providerSpecificData: {
      chatgptAccountId: session.account?.id || '',
      chatgptPlanType: session.account?.planType || 'plus',
    },
    id: generateUUID(),
    provider: 'codex',
    authType: 'oauth',
    name: session.user?.email || '',
    email: session.user?.email || '',
    priority,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// Định dạng thời gian thân thiện bằng tiếng Việt
export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return 'Không rõ hạn';
  try {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} - ngày ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
