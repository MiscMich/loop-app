/**
 * Contact Utilities
 *
 * Phone number normalization, contact filtering, and matching utilities
 * for the contact sync feature (FRIEND-02).
 */

import * as Contacts from 'expo-contacts';
import type { ExistingContact, Contact } from 'expo-contacts';

// =============================================================================
// TYPES
// =============================================================================

export interface NormalizedContact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers: string[];
  normalized: string[];
  imageUri?: string;
  isRegistered?: boolean;
  registeredUserId?: string;
  registeredUsername?: string;
}

export interface PhoneNumberExtractionOptions {
  mobileFirst?: boolean;
  includeCountryCode?: boolean;
}

// =============================================================================
// PHONE NUMBER NORMALIZATION
// =============================================================================

/**
 * Normalize a phone number by stripping all non-numeric characters.
 * Optionally adds country code for US numbers.
 *
 * @param phoneNumber - The phone number to normalize
 * @param countryCode - Optional country code to add if missing (e.g., 'US')
 * @returns Normalized phone number string
 */
export function normalizePhoneNumber(
  phoneNumber: string | null | undefined,
  countryCode?: 'US'
): string {
  if (!phoneNumber) return '';

  // Strip all non-numeric characters
  let normalized = phoneNumber.replace(/\D/g, '');

  // For US numbers, add country code if requested and number is 10 digits
  if (countryCode === 'US' && normalized.length === 10) {
    normalized = '1' + normalized;
  }

  return normalized;
}

/**
 * Format a normalized phone number for display.
 * Supports US phone number format.
 *
 * @param normalizedNumber - The normalized phone number (digits only)
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(normalizedNumber: string): string {
  if (!normalizedNumber) return '';

  const digits = normalizedNumber.replace(/\D/g, '');

  // 11 digits with country code (US): +1 (XXX) XXX-XXXX
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // 10 digits (US): (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 7 digits: XXX-XXXX
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  // Return as-is for other lengths
  return digits;
}

/**
 * Validate if a phone number is valid (US format).
 * Accepts various formats and normalizes before validation.
 *
 * @param phoneNumber - The phone number to validate
 * @returns true if the phone number is valid
 */
export function isValidPhoneNumber(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;

  const normalized = normalizePhoneNumber(phoneNumber);

  // Valid US numbers: 10 digits or 11 digits starting with 1
  if (normalized.length === 10) return true;
  if (normalized.length === 11 && normalized.startsWith('1')) return true;

  return false;
}

// =============================================================================
// CONTACT EXTRACTION
// =============================================================================

/**
 * Extract and normalize all phone numbers from a contact.
 * Can prioritize mobile numbers if specified.
 *
 * @param contact - The expo-contacts Contact or ExistingContact object
 * @param options - Extraction options
 * @returns Array of normalized phone numbers
 */
export function extractContactPhoneNumbers(
  contact: Contact | ExistingContact,
  options: PhoneNumberExtractionOptions = {}
): string[] {
  const { mobileFirst = false } = options;

  if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
    return [];
  }

  let phoneNumbers = [...contact.phoneNumbers];

  // Sort mobile numbers first if requested
  if (mobileFirst) {
    phoneNumbers.sort((a, b) => {
      const aIsMobile = a.label?.toLowerCase().includes('mobile') ||
                        a.label?.toLowerCase().includes('cell') ||
                        a.label?.toLowerCase() === 'iphone';
      const bIsMobile = b.label?.toLowerCase().includes('mobile') ||
                        b.label?.toLowerCase().includes('cell') ||
                        b.label?.toLowerCase() === 'iphone';
      if (aIsMobile && !bIsMobile) return -1;
      if (!aIsMobile && bIsMobile) return 1;
      return 0;
    });
  }

  return phoneNumbers
    .filter((p) => p.number)
    .map((p) => normalizePhoneNumber(p.number!));
}

/**
 * Filter contacts to only those with valid phone numbers.
 *
 * @param contacts - Array of expo-contacts Contact or ExistingContact objects
 * @returns Filtered array of contacts with at least one valid phone number
 */
export function filterContactsWithPhoneNumbers<T extends Contact | ExistingContact>(
  contacts: T[]
): T[] {
  return contacts.filter((contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return false;
    }
    // Must have at least one non-empty phone number
    return contact.phoneNumbers.some((p) => p.number && p.number.trim().length > 0);
  });
}

/**
 * Find a matching contact by phone number.
 *
 * @param phoneNumber - The phone number to search for (any format)
 * @param contacts - Array of normalized contacts
 * @returns The matching contact or null
 */
export function findMatchingContact(
  phoneNumber: string,
  contacts: NormalizedContact[]
): NormalizedContact | null {
  const normalized = normalizePhoneNumber(phoneNumber);

  // Try with and without country code
  const variations = [
    normalized,
    normalized.startsWith('1') ? normalized.slice(1) : '1' + normalized,
  ];

  for (const contact of contacts) {
    for (const variation of variations) {
      if (contact.normalized.includes(variation)) {
        return contact;
      }
    }
  }

  return null;
}

/**
 * Convert expo-contacts ExistingContact to NormalizedContact.
 *
 * @param contact - The expo-contacts ExistingContact object (has guaranteed id)
 * @returns NormalizedContact with all phone numbers normalized
 */
export function normalizeContact(contact: ExistingContact): NormalizedContact {
  const phoneNumbers = extractContactPhoneNumbers(contact, { mobileFirst: true });
  const normalized = phoneNumbers.map((p) => normalizePhoneNumber(p, 'US'));

  return {
    id: contact.id,
    name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
    firstName: contact.firstName ?? undefined,
    lastName: contact.lastName ?? undefined,
    phoneNumbers,
    normalized,
    imageUri: contact.image?.uri,
  };
}

/**
 * Convert array of expo-contacts to NormalizedContacts.
 * Filters out contacts without phone numbers.
 *
 * @param contacts - Array of expo-contacts ExistingContact objects (from getContactsAsync)
 * @returns Array of NormalizedContacts
 */
export function normalizeContacts(contacts: ExistingContact[]): NormalizedContact[] {
  return filterContactsWithPhoneNumbers(contacts).map(normalizeContact);
}

/**
 * Sort contacts alphabetically by name.
 *
 * @param contacts - Array of NormalizedContacts
 * @returns Sorted array
 */
export function sortContactsByName(contacts: NormalizedContact[]): NormalizedContact[] {
  return [...contacts].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Group contacts by first letter of name.
 *
 * @param contacts - Array of NormalizedContacts
 * @returns Map of letter to contacts
 */
export function groupContactsByLetter(
  contacts: NormalizedContact[]
): Map<string, NormalizedContact[]> {
  const groups = new Map<string, NormalizedContact[]>();

  for (const contact of contacts) {
    const firstLetter = (contact.name || '?').charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(contact);
  }

  // Sort within each group
  for (const [letter, group] of groups) {
    groups.set(letter, sortContactsByName(group));
  }

  return groups;
}
