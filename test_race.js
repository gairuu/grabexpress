async function test() {
  const p1 = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
  const p2 = (async () => {
    throw new Error('Immediate failure');
  })();
  
  try {
    await Promise.race([p1, p2]);
  } catch (e) {
    console.log("Race result:", e.message);
  }
}
test();
