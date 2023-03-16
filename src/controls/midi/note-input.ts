const tables = {
  DEFAULT: Array.apply(null, Array(128)).map((_, i) => i),
  DISABLED: Array.apply(null, Array(128)).map(() => -1),
};

export class NoteInputProxy {
  public noteInput: API.NoteInput;

  private _disabled = false;
  private _keyTranslationTable: (number | null)[] = tables.DEFAULT;
  private _shouldConsumeEvents: boolean = true;
  private _changeCallbacks: ((...args: any[]) => void)[] = [];

  constructor(noteInput: API.NoteInput) {
    this.noteInput = noteInput;
  }

  get keyTranslationTable() {
    return this._keyTranslationTable;
  }

  set keyTranslationTable(keyTranslationTable: (number | null)[]) {
    let isValid = keyTranslationTable.length === 128;
    const apiKeyTranslationTable = keyTranslationTable.map((note) => {
      // validate each slot each iteration
      if (!Number.isInteger(note) && note !== null) isValid = false;
      // filter out note values which are invalid to the API
      return note === null || note > 127 || note < 0 ? -1 : note;
    });

    if (!isValid) {
      throw new Error(
        'Invalid note table: must have a length of 128 and only contain null and integer values.'
      );
    }

    this._keyTranslationTable = keyTranslationTable;
    if (!this._disabled) {
      this.noteInput.setKeyTranslationTable(apiKeyTranslationTable);
      // call the registered change callbacks
      this._changeCallbacks.forEach((callback) => callback());
    }
  }

  get shouldConsumeEvents() {
    return this._shouldConsumeEvents;
  }

  set shouldConsumeEvents(shouldConsumeEvents: boolean) {
    this._shouldConsumeEvents = shouldConsumeEvents;
    this.noteInput.setShouldConsumeEvents(shouldConsumeEvents);
  }

  enable() {
    if (!this._disabled) return;
    this._disabled = false;
    this.keyTranslationTable = this.keyTranslationTable;
  }

  disable() {
    if (this._disabled) return;
    this._disabled = true;
    this.noteInput.setKeyTranslationTable(tables.DISABLED);
    // call the registered change callbacks
    this._changeCallbacks.forEach((callback) => callback());
  }

  transpose(steps: number) {
    this.keyTranslationTable = this.keyTranslationTable.map(
      (note) => note && note + steps
    );
  }

  onChange(callback: (...args: any[]) => void) {
    this._changeCallbacks.push(callback);
  }
}
