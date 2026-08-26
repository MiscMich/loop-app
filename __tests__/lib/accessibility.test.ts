import {
  A11Y_ROLES,
  getContentAccessibilityLabel,
  getActionHint,
  buttonA11yProps,
  imageA11yProps,
  headerA11yProps,
  listItemA11yProps,
  progressA11yProps,
  switchA11yProps,
  tabA11yProps,
  formatTimeForA11y,
  formatCountForA11y,
  createAnnouncement,
  shouldBeFocusable,
} from '@/lib/accessibility';

describe('Accessibility Utilities', () => {
  describe('A11Y_ROLES', () => {
    it('should have correct button role', () => {
      expect(A11Y_ROLES.BUTTON).toBe('button');
    });

    it('should have correct header role', () => {
      expect(A11Y_ROLES.HEADER).toBe('header');
    });

    it('should have correct switch role', () => {
      expect(A11Y_ROLES.SWITCH).toBe('switch');
    });
  });

  describe('getContentAccessibilityLabel', () => {
    it('should create label for doodle', () => {
      const label = getContentAccessibilityLabel('doodle', 'John', '5 minutes ago');
      expect(label).toBe('doodle drawing from John, 5 minutes ago');
    });

    it('should create label for photo', () => {
      const label = getContentAccessibilityLabel('photo', 'Jane', '1 hour ago');
      expect(label).toBe('photo from Jane, 1 hour ago');
    });

    it('should create label for mood', () => {
      const label = getContentAccessibilityLabel('mood', 'Alex', 'just now');
      expect(label).toBe('mood update from Alex, just now');
    });

    it('should create label for voice', () => {
      const label = getContentAccessibilityLabel('voice', 'Sam', '2 hours ago');
      expect(label).toBe('voice note from Sam, 2 hours ago');
    });

    it('should create label for game', () => {
      const label = getContentAccessibilityLabel('game', 'Pat', '1 day ago');
      expect(label).toBe('game invitation from Pat, 1 day ago');
    });

    it('should handle unknown content type', () => {
      const label = getContentAccessibilityLabel('unknown', 'User', 'now');
      expect(label).toBe('content from User, now');
    });
  });

  describe('getActionHint', () => {
    it('should return hint for tap action', () => {
      expect(getActionHint('tap')).toBe('Double tap to open');
    });

    it('should return hint for longPress action', () => {
      expect(getActionHint('longPress')).toBe('Double tap and hold for more options');
    });

    it('should return hint for swipe action', () => {
      expect(getActionHint('swipe')).toBe('Swipe left or right for actions');
    });

    it('should return default hint for unknown action', () => {
      expect(getActionHint('unknown')).toBe('Double tap to activate');
    });
  });

  describe('buttonA11yProps', () => {
    it('should return correct props for enabled button', () => {
      const props = buttonA11yProps('Submit', 'Double tap to submit');
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Submit',
        accessibilityHint: 'Double tap to submit',
        accessibilityState: { disabled: false },
      });
    });

    it('should return correct props for disabled button', () => {
      const props = buttonA11yProps('Submit', undefined, true);
      expect(props.accessibilityState).toEqual({ disabled: true });
    });

    it('should use default hint when not provided', () => {
      const props = buttonA11yProps('Click me');
      expect(props.accessibilityHint).toBe('Double tap to open');
    });
  });

  describe('imageA11yProps', () => {
    it('should return correct props for image', () => {
      const props = imageA11yProps('A beautiful sunset');
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: 'image',
        accessibilityLabel: 'A beautiful sunset',
      });
    });
  });

  describe('headerA11yProps', () => {
    it('should return correct props for header', () => {
      const props = headerA11yProps('Welcome');
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: 'header',
        accessibilityLabel: 'Welcome',
      });
    });
  });

  describe('listItemA11yProps', () => {
    it('should return correct props for list item', () => {
      const props = listItemA11yProps('Item name', 2, 10);
      expect(props.accessibilityLabel).toBe('Item name, item 3 of 10');
    });

    it('should handle first item', () => {
      const props = listItemA11yProps('First item', 0, 5);
      expect(props.accessibilityLabel).toBe('First item, item 1 of 5');
    });

    it('should include custom hint', () => {
      const props = listItemA11yProps('Item', 0, 1, 'Custom hint');
      expect(props.accessibilityHint).toBe('Custom hint');
    });
  });

  describe('progressA11yProps', () => {
    it('should return correct props for 50% progress', () => {
      const props = progressA11yProps(50, 100);
      expect(props.accessibilityLabel).toBe('Progress: 50 percent');
      expect(props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 50,
        text: '50%',
      });
    });

    it('should handle 0% progress', () => {
      const props = progressA11yProps(0, 100);
      expect(props.accessibilityValue?.now).toBe(0);
      expect(props.accessibilityValue?.text).toBe('0%');
    });

    it('should handle 100% progress', () => {
      const props = progressA11yProps(100, 100);
      expect(props.accessibilityValue?.now).toBe(100);
      expect(props.accessibilityValue?.text).toBe('100%');
    });

    it('should use custom label', () => {
      const props = progressA11yProps(3, 10, 'Loading');
      expect(props.accessibilityLabel).toBe('Loading');
    });
  });

  describe('switchA11yProps', () => {
    it('should return correct props for switch on', () => {
      const props = switchA11yProps('Dark mode', true);
      expect(props.accessibilityState).toEqual({ checked: true });
      expect(props.accessibilityHint).toBe('Double tap to turn off');
    });

    it('should return correct props for switch off', () => {
      const props = switchA11yProps('Dark mode', false);
      expect(props.accessibilityState).toEqual({ checked: false });
      expect(props.accessibilityHint).toBe('Double tap to turn on');
    });
  });

  describe('tabA11yProps', () => {
    it('should return correct props for selected tab', () => {
      const props = tabA11yProps('Home', true, 0, 3);
      expect(props.accessibilityLabel).toBe('Home, tab 1 of 3');
      expect(props.accessibilityState).toEqual({ selected: true });
      expect(props.accessibilityHint).toBe('Currently selected');
    });

    it('should return correct props for unselected tab', () => {
      const props = tabA11yProps('Settings', false, 2, 3);
      expect(props.accessibilityLabel).toBe('Settings, tab 3 of 3');
      expect(props.accessibilityState).toEqual({ selected: false });
      expect(props.accessibilityHint).toBe('Double tap to select');
    });
  });

  describe('formatTimeForA11y', () => {
    it('should return "just now" for recent time', () => {
      const now = new Date().toISOString();
      expect(formatTimeForA11y(now)).toBe('just now');
    });

    it('should return minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatTimeForA11y(fiveMinAgo)).toBe('5 minutes ago');
    });

    it('should use singular for 1 minute', () => {
      const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      expect(formatTimeForA11y(oneMinAgo)).toBe('1 minute ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatTimeForA11y(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should use singular for 1 hour', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      expect(formatTimeForA11y(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeForA11y(threeDaysAgo)).toBe('3 days ago');
    });

    it('should use singular for 1 day', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeForA11y(oneDayAgo)).toBe('1 day ago');
    });
  });

  describe('formatCountForA11y', () => {
    it('should use singular for count of 1', () => {
      expect(formatCountForA11y(1, 'friend', 'friends')).toBe('1 friend');
    });

    it('should use plural for count of 0', () => {
      expect(formatCountForA11y(0, 'message', 'messages')).toBe('0 messages');
    });

    it('should use plural for count > 1', () => {
      expect(formatCountForA11y(5, 'item', 'items')).toBe('5 items');
    });
  });

  describe('createAnnouncement', () => {
    it('should return the message unchanged', () => {
      expect(createAnnouncement('New message received')).toBe('New message received');
    });

    it('should handle empty message', () => {
      expect(createAnnouncement('')).toBe('');
    });
  });

  describe('shouldBeFocusable', () => {
    it('should return true for button role', () => {
      expect(shouldBeFocusable('button')).toBe(true);
    });

    it('should return true for link role', () => {
      expect(shouldBeFocusable('link')).toBe(true);
    });

    it('should return true for checkbox role', () => {
      expect(shouldBeFocusable('checkbox')).toBe(true);
    });

    it('should return true for switch role', () => {
      expect(shouldBeFocusable('switch')).toBe(true);
    });

    it('should return true for tab role', () => {
      expect(shouldBeFocusable('tab')).toBe(true);
    });

    it('should return false for text role', () => {
      expect(shouldBeFocusable('text')).toBe(false);
    });

    it('should return false for image role', () => {
      expect(shouldBeFocusable('image')).toBe(false);
    });

    it('should return false for header role', () => {
      expect(shouldBeFocusable('header')).toBe(false);
    });
  });
});
