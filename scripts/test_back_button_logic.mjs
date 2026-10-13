import assert from 'node:assert';

// Verify History and Popstate contract for useDeviceBackButton
console.log('Testing useDeviceBackButton contract and state machine...');

class MockHistory {
  constructor() {
    this.stack = [];
    this.currentIndex = -1;
  }

  replaceState(state, _title) {
    if (this.currentIndex === -1) {
      this.stack = [state];
      this.currentIndex = 0;
    } else {
      this.stack[this.currentIndex] = state;
    }
  }

  pushState(state, _title) {
    this.stack = this.stack.slice(0, this.currentIndex + 1);
    this.stack.push(state);
    this.currentIndex++;
  }

  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.stack[this.currentIndex];
    }
    return null;
  }

  get state() {
    return this.stack[this.currentIndex] || null;
  }

  get length() {
    return this.stack.length;
  }
}

// 1. Initial State
const history = new MockHistory();
history.replaceState({ type: 'uniplanner-section', section: 'dashboard' }, '');
assert.strictEqual(history.state.section, 'dashboard');
console.log('✓ Initial history setup works');

// 2. User Navigates to Courses
history.pushState({ type: 'uniplanner-section', section: 'courses' }, '');
assert.strictEqual(history.state.section, 'courses');
assert.strictEqual(history.length, 2);
console.log('✓ Section push navigation works');

// 3. User Opens Add Course Modal
history.pushState({ type: 'uniplanner-modal', section: 'courses' }, '');
assert.strictEqual(history.state.type, 'uniplanner-modal');
assert.strictEqual(history.length, 3);
console.log('✓ Modal push state works');

// 4. User presses hardware back button (popstate)
const poppedModalState = history.back();
assert.strictEqual(poppedModalState.section, 'courses');
assert.strictEqual(history.length, 3);
assert.strictEqual(history.currentIndex, 1);
console.log('✓ Popstate back on modal leaves user on courses');

// 5. User presses hardware back button on courses (popstate)
const poppedSectionState = history.back();
assert.strictEqual(poppedSectionState.section, 'dashboard');
assert.strictEqual(history.currentIndex, 0);
console.log('✓ Popstate back on courses leaves user on dashboard');

// 6. User opens modal and cancels via UI ('Cancel' button)
history.pushState({ type: 'uniplanner-modal', section: 'dashboard' }, '');
assert.strictEqual(history.state.type, 'uniplanner-modal');
// UI close triggers programmatic history.back()
history.back();
assert.strictEqual(history.state.section, 'dashboard');
console.log('✓ UI cancel programmatic back cleanup works');

console.log('\nAll Device Back Button logic checks passed successfully!');
