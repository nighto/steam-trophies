// handle keyboard navigation
document.body.addEventListener('keydown', event => {
  // it'd be easier to just dispatch a keydown key Tab event, but that's not allowed. :()
  // document.body.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Tab', shiftKey: bool }));
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const focusedElement = document.querySelector('*:focus');
    // if nothing is currently focused, we need to focus either on the first or the last
    const allFocusableTargets = document.querySelectorAll('[tabindex]');
    if (!focusedElement) {
      if (event.key === 'ArrowDown') {
        // focus on the first element.
        return allFocusableTargets[0].focus();
      }
      if (event.key === 'ArrowUp') {
        // focus on the last element.
        return allFocusableTargets[allFocusableTargets.length - 1].focus();
      }
    }
    // if something is focused, we can focus the next or the prev, but we need to make sure that it exists
    if (focusedElement) {
      if (event.key === 'ArrowDown') {
        return focusedElement.nextElementSibling ? focusedElement.nextElementSibling.focus() : allFocusableTargets[0].focus();
      }
      if (event.key === 'ArrowUp') {
        return focusedElement.previousElementSibling ? focusedElement.previousElementSibling.focus() : allFocusableTargets[allFocusableTargets.length - 1].focus();
      }
    }
  }
});
