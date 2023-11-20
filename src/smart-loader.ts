import {
  ChangeDetectorRef,
  computed,
  effect,
  Injector,
  runInInjectionContext,
  Signal,
  signal,
  WritableSignal
} from "@angular/core";

class LoaderModel {
  constructor(protected _id: number, protected timing: number = 0, private changeDetectorRef?: ChangeDetectorRef) {
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
      setTimeout(() => {
        this.finish();
        console.log(`[Timer ${ this._id }]`, 'finish')

        if (this.changeDetectorRef) {
          this.changeDetectorRef.detectChanges();
        }
      }, this.timing);
    }
  }

  finish() {
    this._terminated.set(true);
  }
}

export class SmartLoader {
  private readonly _loading: Signal<boolean>;
  private readonly _count: Signal<number>;
  private readonly _loaders: WritableSignal<LoaderModel[]>;

  constructor(private changeDetectorRef?: ChangeDetectorRef, injector?: Injector) {
    this._loaders = signal<LoaderModel[]>([]);

    this._count = computed(() => {
      console.log('[Count]', this._loaders().filter(loader => !loader.terminated()).length);

      return this._loaders().filter(loader => !loader.terminated()).length
    });

    this._loading = computed(() => {
      console.log('[Loading]', this._count() > 0);

      return this._count() > 0
    });

    if (injector) {
      runInInjectionContext(injector, () => {
        effect(() => {
          console.log('[Effect] Loading', this._loading())
        })
      })
    }
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

  addLoader(timing: number = 0): LoaderModel {
    if (!this._loading()) {
      this._loaders.set([]);
    }

    const loader = new LoaderModel(this._loaders().length + 1, timing, this.changeDetectorRef);
    this._loaders.mutate(loaders => loaders.push(loader));

    if (timing > 0) {
      loader.delay();
    }

    if (this.changeDetectorRef) {
      this.changeDetectorRef.detectChanges();
    }

    return loader;
  }
}