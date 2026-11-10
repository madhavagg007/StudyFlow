# Security notes

StudyFlow is local-first: there is no server and no account, so nothing is uploaded unless you choose to save a backup file somewhere.

## Encrypted cloud backup

- A key is derived from your passphrase with PBKDF2-SHA-256 (250,000 iterations) and a random 16-byte salt.
- Data is encrypted with AES-256-GCM using a fresh random 12-byte IV, and the format header is authenticated, so tampering is detected.
- The passphrase is never stored or sent anywhere. The file can sit in Google Drive, iCloud or Dropbox and the provider only sees ciphertext.
- Restoring asks for the passphrase and fails closed on a wrong passphrase or a damaged file.

### Limits you should know about

- **There is no recovery.** A forgotten passphrase means the backup cannot be opened.
- Strength depends on the passphrase. Anyone who obtains the file can try guesses offline, so use a long phrase.
- This is a manual backup you save to your own cloud, not automatic account sync. Automatic sync would need a server, which this project intentionally does not have.
- The older "Export backup" button writes plain JSON. The app warns about this when App Lock is on.

## App Lock

An optional PIN encrypts data at rest in `localStorage` with the same primitives (PBKDF2 150,000 iterations, AES-GCM). A short numeric PIN is only as strong as its length, and it protects against casual access to the device, not against a determined attacker with the data file.

## Reporting a problem

Open a GitHub issue. Please do not include real backup files or passphrases.
