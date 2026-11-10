const test = require("node:test");
const assert = require("node:assert/strict");
const { backupEncrypt, backupDecrypt } = require("../js/backup.js");

const sample = { chapters: [{ name: "Quantum Secrets" }], sessions: [{ minutes: 25 }] };

test("encrypted backup round-trips and hides the plaintext", async () => {
  const env = await backupEncrypt(sample, "correct horse battery");
  assert.equal(env.format, "studyflow-backup");
  assert.ok(!JSON.stringify(env).includes("Quantum Secrets"));
  assert.deepEqual(await backupDecrypt(env, "correct horse battery"), sample);
});

test("a wrong passphrase is rejected", async () => {
  const env = await backupEncrypt(sample, "correct horse battery");
  await assert.rejects(() => backupDecrypt(env, "wrong passphrase!"));
});

test("tampering with the ciphertext or header is detected", async () => {
  const env = await backupEncrypt(sample, "correct horse battery");
  const flipped = { ...env, data: (env.data[0] === "A" ? "B" : "A") + env.data.slice(1) };
  await assert.rejects(() => backupDecrypt(flipped, "correct horse battery"));
  await assert.rejects(() => backupDecrypt({ ...env, v: 2 }, "correct horse battery"));
  await assert.rejects(() => backupDecrypt({ ...env, iter: 10 }, "correct horse battery"));
});

test("short passphrases are refused and every backup uses a fresh salt and IV", async () => {
  await assert.rejects(() => backupEncrypt(sample, "short"));
  const a = await backupEncrypt(sample, "correct horse battery");
  const b = await backupEncrypt(sample, "correct horse battery");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.data, b.data);
});
