function firstDiffIndex(a, b) {
  const minLength = Math.min(a.length, b.length);
  let i = 0;
  for (; i < minLength; i++) {
    if (a[i] !== b[i]) {
      return i
    }
  }
  return i;
}

function generateUsername() {
  return 'User' + crypto.randomUUID();
}

export { firstDiffIndex, generateUsername };
