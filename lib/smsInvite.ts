/**
 * SMS Invite Utilities
 *
 * Generate invite links, send SMS invites, and handle deep link parsing
 * for the friend invite feature (FRIEND-01).
 *
 * NOTE: expo-sms requires EAS build. In dev client without EAS build,
 * SMS functionality returns graceful error messages.
 */

import * as Linking from 'expo-linking';
import { isValidPhoneNumber, normalizePhoneNumber } from './contacts';
import { logger } from './logger';

// Lazy-load SMS module to avoid crash when native module isn't available
let SMS: typeof import('expo-sms') | null = null;
let smsModuleChecked = false;
let smsModuleAvailable = false;

async function getSmsModule() {
  const isTest = process.env.NODE_ENV === 'test';
  if (smsModuleChecked && !isTest) return { SMS, available: smsModuleAvailable };

  try {
    SMS = require('expo-sms') as typeof import('expo-sms');
    const isAvailable = await SMS.isAvailableAsync();
    smsModuleAvailable = isAvailable;
    logger.debug('SMS module available', { action: 'getSmsModule', metadata: { isAvailable } });
  } catch (error) {
    SMS = null;
    smsModuleAvailable = false;
    logger.warn('SMS native module not available (requires EAS build) - SMS disabled', { action: 'getSmsModule' });
  }

  if (!isTest) {
    smsModuleChecked = true;
  }
  return { SMS, available: smsModuleAvailable };
}

// =============================================================================
// TYPES
// =============================================================================

export interface InviteParams {
  phoneNumber: string;
  inviterName: string;
  inviterId?: string;
}

export interface GenerateInviteLinkOptions {
  inviterName: string;
  inviterId?: string;
}

export interface ParsedInvite {
  inviterName: string;
  inviterId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SendInviteResult {
  success: boolean;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Deep link scheme
const DEEP_LINK_SCHEME = 'loop';
const INVITE_PATH = 'invite';

// =============================================================================
// INVITE LINK GENERATION
// =============================================================================

/**
 * Generate a deep link URL for inviting a friend.
 *
 * @param options - Invite link options
 * @returns Deep link URL string
 */
export function generateInviteLink(options: GenerateInviteLinkOptions): string {
  const queryParams: Record<string, string> = {
    from: options.inviterName,
  };

  if (options.inviterId) {
    queryParams.id = options.inviterId;
  }

  return Linking.createURL(INVITE_PATH, { queryParams });
}

/**
 * Generate a friendly SMS invite message.
 *
 * @param inviterName - Name of the person sending the invite
 * @param inviteLink - The deep link URL
 * @returns Formatted invite message
 */
export function generateInviteMessage(inviterName: string, inviteLink: string): string {
  return `${inviterName} wants to Loop with you! Connect with your closest friends through doodles, photos, games, and more.\n\nOpen invite: ${inviteLink}`;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate invite parameters before sending.
 *
 * @param params - The invite parameters to validate
 * @returns Validation result with any errors
 */
export function validateInviteParams(params: InviteParams): ValidationResult {
  const errors: string[] = [];

  // Validate phone number
  if (!isValidPhoneNumber(params.phoneNumber)) {
    errors.push('Invalid phone number');
  }

  // Validate inviter name
  if (!params.inviterName || params.inviterName.trim().length === 0) {
    errors.push('Inviter name is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// DEEP LINK PARSING
// =============================================================================

/**
 * Parse an invite deep link to extract invite data.
 *
 * @param url - The deep link URL to parse
 * @returns Parsed invite data or null if invalid
 */
export function parseInviteLink(url: string): ParsedInvite | null {
  try {
    const parsed = Linking.parse(url);

    // Check if this is a valid invite link
    if (!parsed.path?.includes(INVITE_PATH)) {
      return null;
    }

    const inviterName = parsed.queryParams?.from as string | undefined;
    if (!inviterName) {
      return null;
    }

    return {
      inviterName,
      inviterId: parsed.queryParams?.id as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Loop invite link.
 *
 * @param url - The URL to check
 * @returns true if the URL is a valid invite link
 */
export function isInviteLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const hasInvitePath = parsed.path?.includes(INVITE_PATH) ?? false;
    const hasFromParam = Boolean(parsed.queryParams?.from);
    return hasInvitePath && hasFromParam;
  } catch {
    return false;
  }
}

// =============================================================================
// SMS FUNCTIONALITY
// =============================================================================

/**
 * Check if SMS is available on the device.
 *
 * @returns true if SMS can be sent
 */
export async function canSendSMS(): Promise<boolean> {
  const { SMS: smsModule, available } = await getSmsModule();
  if (!smsModule || !available) return false;
  try {
    return await smsModule.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Send an SMS invite to a phone number.
 *
 * @param params - The invite parameters
 * @returns Result of the send operation
 */
export async function sendInvite(params: InviteParams): Promise<SendInviteResult> {
  // Validate parameters
  const validation = validateInviteParams(params);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join(', '),
    };
  }

  // Check SMS availability
  const smsAvailable = await canSendSMS();
  if (!smsAvailable) {
    return {
      success: false,
      error: 'SMS is not available on this device',
    };
  }

  // Generate invite link and message
  const inviteLink = generateInviteLink({
    inviterName: params.inviterName,
    inviterId: params.inviterId,
  });
  const message = generateInviteMessage(params.inviterName, inviteLink);

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(params.phoneNumber);

  try {
    const { SMS: smsModule, available } = await getSmsModule();
    if (!smsModule || !available) {
      return {
        success: false,
        error: 'SMS not available (requires EAS build)',
      };
    }

    const result = await smsModule.sendSMSAsync([normalizedPhone], message);

    // Note: SMS.sendSMSAsync doesn't actually tell us if the SMS was sent,
    // only that the SMS composer was opened. We assume success if no error.
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * Send SMS invites to multiple phone numbers.
 *
 * @param phoneNumbers - Array of phone numbers to invite
 * @param inviterName - Name of the person sending invites
 * @param inviterId - Optional ID of the inviter
 * @returns Result of the send operation
 */
export async function sendBulkInvites(
  phoneNumbers: string[],
  inviterName: string,
  inviterId?: string
): Promise<SendInviteResult> {
  if (phoneNumbers.length === 0) {
    return {
      success: false,
      error: 'No phone numbers provided',
    };
  }

  // Validate all phone numbers
  const invalidNumbers = phoneNumbers.filter((p) => !isValidPhoneNumber(p));
  if (invalidNumbers.length > 0) {
    return {
      success: false,
      error: `Invalid phone numbers: ${invalidNumbers.length}`,
    };
  }

  // Check SMS availability
  const smsAvailable = await canSendSMS();
  if (!smsAvailable) {
    return {
      success: false,
      error: 'SMS is not available on this device',
    };
  }

  // Generate invite link and message
  const inviteLink = generateInviteLink({ inviterName, inviterId });
  const message = generateInviteMessage(inviterName, inviteLink);

  // Normalize all phone numbers
  const normalizedNumbers = phoneNumbers.map((p) => normalizePhoneNumber(p));

  try {
    const { SMS: smsModule, available } = await getSmsModule();
    if (!smsModule || !available) {
      return {
        success: false,
        error: 'SMS not available (requires EAS build)',
      };
    }
    await smsModule.sendSMSAsync(normalizedNumbers, message);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}
