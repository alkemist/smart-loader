import { effect, Injector, runInInjectionContext, signal } from '@angular/core';
import { SmartLoader } from './smart-loader.js';

export class Poller {
  loader = new SmartLoader();
  waitCallback = signal<boolean>(false);

  constructor(
    private injector: Injector,
    private timing: number,
    private callback: () => Promise<void>
  ) {

  }

  async start() {
    runInInjectionContext(this.injector, () => {
      effect(async () => {
        console.log('[Effect] OK ?', this.loader.loading(), this.waitCallback())
        if (!this.loader.loading() && !this.waitCallback()) {
          void this.loop();
        }
      }, { allowSignalWrites: true, injector: this.injector })
    });

    void this.loop();
  }

  pause() {
    console.log('[Polling] Pause')
    this.loader.clean();
  }

  private async loop() {
    /*this.waitCallback.set(true);
    await this.callback();
    this.waitCallback.set(false);
    this.loader.addLoader(this.timing);*/

    this.waitCallback.set(true);
    this.callback().then(() => {
      console.log('[Callback] Next')
      this.loader.addLoader(this.timing);
      this.waitCallback.set(false);
    })
  }
}