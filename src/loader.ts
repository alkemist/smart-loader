import { Signal, signal, } from "@angular/core";

export class Loader {
  private timer: null | ReturnType<typeof setTimeout> = null;

  constructor(protected _id: number, protected timing: number = 0) {
  }

  private _terminated = signal(false);

  get terminated(): Signal<boolean> {
    return this._terminated.asReadonly();
  }

  get id() {
    return this._id;
  }

  delay() {
    if (this.timing > 0) {
      console.log(`[Timer ${ this._id }]`, 'start')

      this.timer = setTimeout(() => {
        this.finish();
      }, this.timing);
    }
  }

  finish() {
    if (this._terminated()) {
      return;
    }

    if (this.timer !== null) {
      console.log(`[Timer ${ this._id }]`, 'finish')

      clearTimeout(this.timer);
    }

    this._terminated.set(true);
  }
}