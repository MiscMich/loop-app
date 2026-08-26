/**
 * Tests for SMS Invite Utilities
 * lib/smsInvite.ts
 */

import {
  generateInviteLink,
  generateInviteMessage,
  canSendSMS,
  validateInviteParams,
  parseInviteLink,
  type InviteParams,
} from '@/lib/smsInvite';

// Mock expo-sms
jest.mock('expo-sms', () => ({
  isAvailableAsync: jest.fn(),
  sendSMSAsync: jest.fn(),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string, opts?: { queryParams?: Record<string, string> }) => {
    const params = opts?.queryParams;
    const query = params ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    return `loop://${path}${query}`;
  }),
  parse: jest.fn((url: string) => {
    const [path, queryString] = url.replace('loop://', '').split('?');
    const queryParams: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach((param) => {
        const [key, value] = param.split('=');
        queryParams[key] = decodeURIComponent(value);
      });
    }
    return { path, queryParams };
  }),
}));

describe('generateInviteLink', () => {
  it('should generate a valid deep link with inviter name', () => {
    const link = generateInviteLink({ inviterName: 'John' });
    expect(link).toContain('loop://');
    expect(link).toContain('invite');
    expect(link).toContain('from=John');
  });

  it('should include inviter ID if provided', () => {
    const link = generateInviteLink({ inviterName: 'John', inviterId: 'user_123' });
    expect(link).toContain('id=user_123');
  });

  it('should encode special characters in name', () => {
    const link = generateInviteLink({ inviterName: "John O'Brien" });
    expect(link).toContain("John%20O'Brien");
  });
});

describe('generateInviteMessage', () => {
  it('should generate a friendly invite message', () => {
    const message = generateInviteMessage('John', 'loop://invite?from=John');
    expect(message).toContain('John');
    expect(message).toContain('Loop');
    expect(message).toContain('loop://invite');
  });

  it('should not advertise an unpublished store listing', () => {
    const message = generateInviteMessage('Jane', 'loop://invite?from=Jane');
    expect(message).not.toContain(['apps', 'apple', 'com'].join('.'));
    expect(message).toContain('Open invite: loop://invite?from=Jane');
  });
});

describe('validateInviteParams', () => {
  it('should validate valid params', () => {
    const params: InviteParams = {
      phoneNumber: '5551234567',
      inviterName: 'John',
    };
    const result = validateInviteParams(params);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid phone number', () => {
    const params: InviteParams = {
      phoneNumber: '123',
      inviterName: 'John',
    };
    const result = validateInviteParams(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid phone number');
  });

  it('should reject empty inviter name', () => {
    const params: InviteParams = {
      phoneNumber: '5551234567',
      inviterName: '',
    };
    const result = validateInviteParams(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Inviter name is required');
  });
});

describe('parseInviteLink', () => {
  it('should parse valid invite link', () => {
    const result = parseInviteLink('loop://invite?from=John&id=user_123');
    expect(result).toEqual({
      inviterName: 'John',
      inviterId: 'user_123',
    });
  });

  it('should handle missing id', () => {
    const result = parseInviteLink('loop://invite?from=Jane');
    expect(result).toEqual({
      inviterName: 'Jane',
      inviterId: undefined,
    });
  });

  it('should return null for invalid link', () => {
    const result = parseInviteLink('https://google.com');
    expect(result).toBeNull();
  });
});

describe('canSendSMS', () => {
  const SMS = require('expo-sms');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when SMS is available', async () => {
    SMS.isAvailableAsync.mockResolvedValue(true);
    const result = await canSendSMS();
    expect(result).toBe(true);
  });

  it('should return false when SMS is not available', async () => {
    SMS.isAvailableAsync.mockResolvedValue(false);
    const result = await canSendSMS();
    expect(result).toBe(false);
  });
});
