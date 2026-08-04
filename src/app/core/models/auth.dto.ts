export interface LoginDto {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUserResponseDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  branchId: string | null;
  mfaEnabled: boolean;
  mustChangePassword: boolean;
  permissions: string[];
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUserResponseDto;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
