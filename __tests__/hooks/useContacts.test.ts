/**
 * Tests for useContacts Hook
 * hooks/useContacts.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useContacts, ContactPermissionStatus } from '@/hooks/useContacts';

// Mock expo-contacts
jest.mock('expo-contacts', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  Fields: {
    PhoneNumbers: 'phoneNumbers',
    Name: 'name',
    FirstName: 'firstName',
    LastName: 'lastName',
    Image: 'image',
  },
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

const Contacts = require('expo-contacts');

const mockContacts = [
  {
    id: '1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumbers: [{ id: 'p1', number: '(555) 123-4567', label: 'mobile' }],
  },
  {
    id: '2',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    phoneNumbers: [{ id: 'p2', number: '(555) 987-6543', label: 'home' }],
  },
  {
    id: '3',
    name: 'No Phone Contact',
    firstName: 'No',
    lastName: 'Phone',
  },
];

describe('useContacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('permission handling', () => {
    it('should start with undetermined permission status', () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });

      const { result } = renderHook(() => useContacts());
      expect(result.current.permissionStatus).toBe('undetermined');
    });

    it('should request permission when requestPermission is called', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(Contacts.requestPermissionsAsync).toHaveBeenCalled();
      expect(result.current.permissionStatus).toBe('granted');
    });

    it('should update status to denied when permission is denied', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.contacts).toEqual([]);
    });
  });

  describe('contact fetching', () => {
    it('should fetch contacts after permission is granted', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Contacts.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(Contacts.getContactsAsync).toHaveBeenCalled();
      // Should filter out contacts without phone numbers
      expect(result.current.contacts).toHaveLength(2);
    });

    it('should set isLoading to false after fetch completes', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.refreshContacts();
      });

      // After completion, isLoading should be false
      expect(result.current.isLoading).toBe(false);
      // And contacts should be loaded
      expect(result.current.contacts.length).toBeGreaterThan(0);
    });
  });

  describe('search functionality', () => {
    it('should filter contacts by search query', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.refreshContacts();
      });

      act(() => {
        result.current.setSearchQuery('John');
      });

      expect(result.current.filteredContacts).toHaveLength(1);
      expect(result.current.filteredContacts[0].name).toBe('John Doe');
    });

    it('should search by phone number', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.refreshContacts();
      });

      act(() => {
        result.current.setSearchQuery('987');
      });

      expect(result.current.filteredContacts).toHaveLength(1);
      expect(result.current.filteredContacts[0].name).toBe('Jane Smith');
    });

    it('should return all contacts when search query is empty', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.refreshContacts();
      });

      act(() => {
        result.current.setSearchQuery('');
      });

      // Should have 2 contacts (those with phone numbers)
      expect(result.current.filteredContacts).toHaveLength(2);
    });
  });

  describe('registered user matching', () => {
    it('should have registeredContacts and invitableContacts computed properties', async () => {
      // Note: Full Supabase integration test requires actual backend
      // This test verifies the computed properties work correctly
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.requestPermission();
      });

      // Without Supabase configured, all contacts should be invitable
      expect(result.current.registeredContacts).toEqual([]);
      expect(result.current.invitableContacts).toHaveLength(2);
    });

    it('should provide isContactRegistered helper function', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockResolvedValue({ data: mockContacts });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.requestPermission();
      });

      // Without Supabase, no contacts should be registered
      expect(result.current.isContactRegistered('1')).toBe(false);
      expect(result.current.isContactRegistered('nonexistent')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      Contacts.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Contacts.getContactsAsync.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.refreshContacts();
      });

      expect(result.current.error).toBe('Failed to load contacts');
      expect(result.current.contacts).toEqual([]);
    });
  });
});
