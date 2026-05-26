export interface ChatGPTSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  account?: {
    id?: string;
    planType?: string;
  };
  accessToken?: string;
  sessionToken?: string;
  expires?: string;
}

export interface CodexConnection {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  testStatus: string;
  expiresIn: number;
  providerSpecificData: {
    chatgptAccountId: string;
    chatgptPlanType: string;
  };
  id: string;
  provider: string;
  authType: string;
  name: string;
  email: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedProfile {
  name: string;
  email: string;
  avatar: string;
  plan: string;
  expires: string;
}
