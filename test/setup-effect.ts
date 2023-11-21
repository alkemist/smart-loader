import { ChangeDetectorRef, Component, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
  standalone: true,
  template: ''
})
export class NoopComponent {
  constructor() {
  }
}

export interface SignalTesting {
  flushEffects: () => void,
  runInTestingInjectionContext: <T>(fn: (component: NoopComponent, injector: Injector, fixture: ChangeDetectorRef) => T) => T
}

export function setUpSignalTesting(component = NoopComponent) {
  const injector = TestBed.inject(Injector);
  const fixture = TestBed.createComponent(component);

  // Inspiration: https://github.com/angular/angular/blob/06b498f67f2ad16bb465ef378bdb16da84e41a1c/packages/core/rxjs-interop/test/to_observable_spec.ts#LL30C25-L30C25
  return {
    flushEffects() {
      fixture.detectChanges();
    },
    runInTestingInjectionContext<T>(fn: (component: NoopComponent, injector: Injector, fixture: ChangeDetectorRef) => T): T {
      return runInInjectionContext(injector, () => {
        return fn(fixture.componentInstance, injector, fixture.changeDetectorRef);
      });
    }
  };
}