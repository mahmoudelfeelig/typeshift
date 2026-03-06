let databaseOnline = false;

export function setDatabaseOnline(value: boolean): void {
  databaseOnline = value;
}

export function isDatabaseOnline(): boolean {
  return databaseOnline;
}
