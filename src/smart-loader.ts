import { computed, effect, Injector, runInInjectionContext, signal, Signal, WritableSignal } from "@angular/core";
import { Loader } from './loader.js'


export class SmartLoader {
  private readonly _loading: Signal<boolean>;
  private readonly _count: Signal<number>;
  private readonly _loaders: WritableSignal<Loader[]>;
  private polling: boolean = false;

  constructor() {
    this._loaders = signal<Loader[]>([]);

    this._count = computed(() => {
      //console.log('[Count]', this._loaders().filter(loader => !loader.terminated()).length);

      return this._loaders().filter(loader => !loader.terminated()).length
    });

    this._loading = computed(() => {
      //console.log('[Loading]', this._count() > 0);

      return this._count() > 0
    });
  }

  get loading(): Signal<boolean> {
    return this._loading;
  }

  get count(): Signal<number> {
    return this._count;
  }

  private get length() {
    return this._loaders().length;
  }

  addLoader(timing: number = 0): Loader {
    if (!this._loading()) {
      this._loaders.set([]);
    }

    const loader = new Loader(this._loaders().length + 1, timing);
    //this._loaders.mutate(loaders => loaders.push(loader));
    this._loaders.update(loaders => ([ ...loaders, loader ]));

    if (timing > 0) {
      loader.delay();
    }

    return loader;
  }

  startPolling(injector: Injector, timing: number) {
    this.polling = true;

    runInInjectionContext(injector, () => {
      effect(() => {
        //console.log('[Polling] ???', !this.loading(), this.polling);
        if (!this.loading() && this.polling) {
          console.log('[Polling] Next');
          this.addLoader(timing);
        }
      }, { allowSignalWrites: true, injector })
    });

    this.addLoader(timing);
  }

  clean() {
    this.polling = false;
    this._loaders().map(loader => loader.finish());
    //console.log('[Polling] End', this._loading())
  }
}