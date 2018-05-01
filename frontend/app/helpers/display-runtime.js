import { helper } from '@ember/component/helper';

export function displayRuntime([total, display]) {
  if (display === 'hours') {
    let hours = Math.floor(total / 60);
    let minutes = total % 60;
    return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    return `${total} minutes`;
  }
}

export default helper(displayRuntime);
