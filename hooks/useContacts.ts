/**
 * useContacts Hook
 *
 * Handles contact permission, fetching, and synchronization with
 * registered Loop users (FRIEND-02).
 *
 * Features:
 * - Permission request and status tracking
 * - Contact fetching with phone number filtering
 * - Search/filter functionality
 * - Matching contacts with registered Loop users
 *
 * NOTE: expo-contacts requires EAS build (native module). In dev client
 * without EAS build, contacts functionality is disabled with a warning.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  normalizeContacts,
  sortContactsByName,
  type NormalizedContact,
} from '@/lib/contacts';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Lazy-load Contacts to avoid crash when native module isn't available
let Contacts: typeof import('expo-contacts') | null = null;
let contactsModuleChecked = false;
let contactsModuleAvailable = false;

async function getContactsModule() {
  const isTest = process.env.NODE_ENV === 'test';
  if (contactsModuleChecked && !isTest) {
    return Contacts;
  }

  try {
    Contacts = require('expo-contacts') as typeof import('expo-contacts');
    // Verify the module actually works
    await Contacts.getPermissionsAsync();
    contactsModuleAvailable = true;
    logger.debug('Contacts native module available', { action: 'getContactsModule' });
  } catch (error) {
    Contacts = null;
    contactsModuleAvailable = false;
    logger.warn('Contacts native module not available (requires EAS build) - contacts disabled', { action: 'getContactsModule' });
  }

  if (!isTest) {
    contactsModuleChecked = true;
  }
  return Contacts;
}

// =============================================================================
// TYPES
// =============================================================================

export type ContactPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface UseContactsResult {
  /** All contacts with phone numbers (filtered, sorted) */
  contacts: NormalizedContact[];
  /** Contacts filtered by current search query */
  filteredContacts: NormalizedContact[];
  /** Current permission status */
  permissionStatus: ContactPermissionStatus;
  /** Loading state during fetch operations */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Current search query */
  searchQuery: string;
  /** Contacts that are registered Loop users */
  registeredContacts: NormalizedContact[];
  /** Contacts that are not registered (can be invited) */
  invitableContacts: NormalizedContact[];

  /** Request contact permission */
  requestPermission: () => Promise<void>;
  /** Refresh contacts from device */
  refreshContacts: () => Promise<void>;
  /** Set search query for filtering */
  setSearchQuery: (query: string) => void;
  /** Check if a specific contact is registered */
  isContactRegistered: (contactId: string) => boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useContacts(): UseContactsResult {
  // State
  const [contacts, setContacts] = useState<NormalizedContact[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<ContactPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredPhoneNumbers, setRegisteredPhoneNumbers] = useState<Map<string, {
    userId: string;
    username: string;
  }>>(new Map());

  // ==========================================================================
  // Registered User Matching (defined first due to dependency order)
  // ==========================================================================

  /**
   * Check which contacts are registered Loop users
   *
   * Note: The current loop_users schema doesn't have phone_number field.
   * This is a placeholder for future phone-based matching.
   * For now, we could match by email if contacts have email addresses,
   * or this could be enabled once phone_number is added to the schema.
   *
   * @param _contactList - List of contacts to check
   * @param signal - AbortSignal for request cancellation
   */
  const checkRegisteredUsers = useCallback(async (
    _contactList: NormalizedContact[],
    signal?: AbortSignal
  ) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    // Check if request was cancelled
    if (signal?.aborted) {
      return;
    }

    // TODO: Enable phone number matching when loop_users schema includes phone_number
    // For now, all contacts are marked as not registered (invitable)
    //
    // Future implementation with AbortController:
    // const allPhoneNumbers = new Set<string>();
    // for (const contact of contactList) {
    //   for (const number of contact.normalized) {
    //     allPhoneNumbers.add(number);
    //   }
    // }
    //
    // const { data } = await supabase
    //   .from('loop_users')
    //   .select('id, username, phone_number')
    //   .in('phone_number', Array.from(allPhoneNumbers))
    //   .abortSignal(signal);  // Supabase supports AbortSignal
    //
    // Then update contacts with isRegistered status

    // Clear any stale registered data
    setRegisteredPhoneNumbers(new Map());
  }, []);

  // ==========================================================================
  // Contact Fetching
  // ==========================================================================

  /**
   * Fetch contacts from device with cancellation support
   */
  const fetchContacts = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if request was cancelled before starting
      if (signal?.aborted) {
        return;
      }

      // Get contacts module (lazy-loaded)
      const ContactsModule = await getContactsModule();
      if (!ContactsModule || !contactsModuleAvailable) {
        setError('Contacts not available (requires EAS build)');
        setIsLoading(false);
        return;
      }

      const { data } = await ContactsModule.getContactsAsync({
        fields: [
          ContactsModule.Fields.PhoneNumbers,
          ContactsModule.Fields.Name,
          ContactsModule.Fields.FirstName,
          ContactsModule.Fields.LastName,
          ContactsModule.Fields.Image,
        ],
      });

      // Check if cancelled during fetch
      if (signal?.aborted) {
        return;
      }

      // Normalize and sort contacts
      const normalized = sortContactsByName(normalizeContacts(data));
      setContacts(normalized);

      // Check which contacts are registered Loop users
      await checkRegisteredUsers(normalized, signal);
    } catch (err: any) {
      // Don't set error state for aborted requests
      if (err?.name === 'AbortError' || signal?.aborted) {
        return;
      }
      logger.error('Error fetching contacts', { action: 'fetchContacts' }, err);
      setError('Failed to load contacts');
      setContacts([]);
    } finally {
      // Only update loading state if not aborted
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [checkRegisteredUsers]);

  /**
   * Refresh contacts (public method)
   */
  const refreshContacts = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      setError('Contact permission not granted');
      return;
    }
    await fetchContacts(undefined);
  }, [permissionStatus, fetchContacts]);

  // ==========================================================================
  // Permission Handling
  // ==========================================================================

  /**
   * Request contact permission from user
   */
  const requestPermission = useCallback(async () => {
    try {
      setError(null);

      // Get contacts module (lazy-loaded)
      const ContactsModule = await getContactsModule();
      if (!ContactsModule || !contactsModuleAvailable) {
        setError('Contacts not available (requires EAS build)');
        return;
      }

      const { status } = await ContactsModule.requestPermissionsAsync();
      setPermissionStatus(status as ContactPermissionStatus);

      if (status === 'granted') {
        await fetchContacts(undefined);
      }
    } catch (err) {
      logger.error('Error requesting contact permission', { action: 'requestPermission' }, err);
      setError('Failed to request permission');
    }
  }, [fetchContacts]);

  /**
   * Check current permission status on mount with AbortController for cleanup
   */
  useEffect(() => {
    const controller = new AbortController();

    const checkPermissionStatus = async (signal: AbortSignal) => {
      try {
        if (signal.aborted) return;

        // Get contacts module (lazy-loaded)
        const ContactsModule = await getContactsModule();
        if (!ContactsModule || !contactsModuleAvailable) {
          // Contacts not available - set error but don't crash
          setError('Contacts not available (requires EAS build)');
          return;
        }

        if (signal.aborted) return;

        const { status } = await ContactsModule.getPermissionsAsync();

        if (signal.aborted) return;

        setPermissionStatus(status as ContactPermissionStatus);

        // If already granted, fetch contacts
        if (status === 'granted') {
          fetchContacts(signal);
        }
      } catch (err) {
        if (signal.aborted) return;
        logger.error('Error checking contact permission', { action: 'checkPermissionStatus' }, err);
      }
    };

    checkPermissionStatus(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchContacts]);

  // ==========================================================================
  // Filtering & Derived State
  // ==========================================================================

  /**
   * Filter contacts by search query
   */
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase().trim();
    return contacts.filter((contact) => {
      // Search by name
      if (contact.name?.toLowerCase().includes(query)) {
        return true;
      }
      // Search by first or last name
      if (contact.firstName?.toLowerCase().includes(query)) {
        return true;
      }
      if (contact.lastName?.toLowerCase().includes(query)) {
        return true;
      }
      // Search by phone number
      for (const number of contact.phoneNumbers) {
        if (number.includes(query)) {
          return true;
        }
      }
      return false;
    });
  }, [contacts, searchQuery]);

  /**
   * Get registered contacts only
   */
  const registeredContacts = useMemo(() => {
    return contacts.filter((c) => c.isRegistered);
  }, [contacts]);

  /**
   * Get invitable contacts (not registered)
   */
  const invitableContacts = useMemo(() => {
    return contacts.filter((c) => !c.isRegistered);
  }, [contacts]);

  /**
   * Check if a specific contact is registered
   */
  const isContactRegistered = useCallback(
    (contactId: string): boolean => {
      const contact = contacts.find((c) => c.id === contactId);
      return contact?.isRegistered ?? false;
    },
    [contacts]
  );

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    contacts,
    filteredContacts,
    permissionStatus,
    isLoading,
    error,
    searchQuery,
    registeredContacts,
    invitableContacts,
    requestPermission,
    refreshContacts,
    setSearchQuery,
    isContactRegistered,
  };
}
