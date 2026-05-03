// Backwards-compatible no-op wrapper — pages now use <UserShell> directly.
// Kept as an empty export so legacy imports continue to compile while pages
// are being migrated.
export function UserNavigation() {
  return null;
}

export default UserNavigation;
