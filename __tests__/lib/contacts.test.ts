/**
 * Tests for Contact Utilities
 * lib/contacts.ts
 */

import {
  normalizePhoneNumber,
  formatPhoneNumber,
  isValidPhoneNumber,
  extractContactPhoneNumbers,
  findMatchingContact,
  filterContactsWithPhoneNumbers,
  type NormalizedContact,
} from '@/lib/contacts';

describe('normalizePhoneNumber', () => {
  it('should strip all non-numeric characters', () => {
    expect(normalizePhoneNumber('(555) 123-4567')).toBe('5551234567');
    expect(normalizePhoneNumber('+1-555-123-4567')).toBe('15551234567');
    expect(normalizePhoneNumber('555.123.4567')).toBe('5551234567');
  });

  it('should handle numbers with country code', () => {
    expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
    expect(normalizePhoneNumber('1-555-123-4567')).toBe('15551234567');
  });

  it('should handle empty or invalid input', () => {
    expect(normalizePhoneNumber('')).toBe('');
    expect(normalizePhoneNumber(null as any)).toBe('');
    expect(normalizePhoneNumber(undefined as any)).toBe('');
  });

  it('should add country code if missing for US numbers', () => {
    expect(normalizePhoneNumber('5551234567', 'US')).toBe('15551234567');
  });
});

describe('formatPhoneNumber', () => {
  it('should format US numbers correctly', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('should handle short numbers', () => {
    expect(formatPhoneNumber('1234567')).toBe('123-4567');
    expect(formatPhoneNumber('123')).toBe('123');
  });

  it('should handle empty input', () => {
    expect(formatPhoneNumber('')).toBe('');
  });
});

describe('isValidPhoneNumber', () => {
  it('should validate US phone numbers', () => {
    expect(isValidPhoneNumber('5551234567')).toBe(true);
    expect(isValidPhoneNumber('15551234567')).toBe(true);
    expect(isValidPhoneNumber('+15551234567')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('abcdefghij')).toBe(false);
  });
});

describe('extractContactPhoneNumbers', () => {
  const mockContact = {
    id: '1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumbers: [
      { id: 'p1', number: '(555) 123-4567', label: 'mobile' },
      { id: 'p2', number: '(555) 987-6543', label: 'home' },
    ],
  };

  it('should extract and normalize all phone numbers', () => {
    const result = extractContactPhoneNumbers(mockContact as any);
    expect(result).toEqual(['5551234567', '5559876543']);
  });

  it('should prioritize mobile numbers', () => {
    const result = extractContactPhoneNumbers(mockContact as any, { mobileFirst: true });
    expect(result[0]).toBe('5551234567'); // mobile should be first
  });

  it('should handle contacts without phone numbers', () => {
    const contactNoPhone = { id: '2', name: 'Jane Doe' };
    expect(extractContactPhoneNumbers(contactNoPhone as any)).toEqual([]);
  });
});

describe('filterContactsWithPhoneNumbers', () => {
  const mockContacts = [
    { id: '1', name: 'With Phone', phoneNumbers: [{ number: '5551234567' }] },
    { id: '2', name: 'No Phone' },
    { id: '3', name: 'Empty Phone', phoneNumbers: [] },
    { id: '4', name: 'Another Phone', phoneNumbers: [{ number: '5559876543' }] },
  ];

  it('should filter out contacts without valid phone numbers', () => {
    const result = filterContactsWithPhoneNumbers(mockContacts as any);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.name)).toEqual(['With Phone', 'Another Phone']);
  });
});

describe('findMatchingContact', () => {
  const mockContacts: NormalizedContact[] = [
    { id: '1', name: 'John Doe', phoneNumbers: ['5551234567'], normalized: ['15551234567'] },
    { id: '2', name: 'Jane Smith', phoneNumbers: ['5559876543'], normalized: ['15559876543'] },
  ];

  it('should find contact by normalized phone number', () => {
    const result = findMatchingContact('15551234567', mockContacts);
    expect(result?.name).toBe('John Doe');
  });

  it('should find contact even with different format', () => {
    const result = findMatchingContact('+1 (555) 123-4567', mockContacts);
    expect(result?.name).toBe('John Doe');
  });

  it('should return null if no match found', () => {
    const result = findMatchingContact('9999999999', mockContacts);
    expect(result).toBeNull();
  });
});
