import { describe, expect, it } from '@jest/globals';
import { SmartLoader } from '../src/smart-loader.js';
import { NoopComponent, setUpSignalTesting, SignalTesting } from './setup-effect.js';
import { ChangeDetectorRef, effect, Injector } from '@angular/core';

interface TickTest {
  tickCount: number,
  loadingExpected: boolean,
  loadersLength: number,
  loadersCount: number,
}

interface LoaderTest {
  start: number,
  duration: number
}

interface SmartLoaderTest {
  name: string,
  loaders: LoaderTest[],
  ticks: TickTest[],
  changes: number
}

describe("SmartLoader", () => {
  let signalTesting: SignalTesting;
  const tickDuration = 1000;

  const testValues: SmartLoaderTest[] = [
    {
      name: 'one time',
      loaders: [
        { start: 0, duration: 2 }
      ],
      ticks: [
        { tickCount: 0, loadingExpected: true, loadersLength: 1, loadersCount: 1 },   // 0 : 2       add
        { tickCount: 1, loadingExpected: true, loadersLength: 1, loadersCount: 1 },   // 1 : 1
        { tickCount: 1, loadingExpected: false, loadersLength: 1, loadersCount: 0 }   // 2 : 0
      ],
      changes: 2,
    },
    {
      name: 'multiple async time',
      loaders: [
        { start: 0, duration: 1 },
        { start: 0, duration: 3 }
      ],
      ticks: [
        { tickCount: 0, loadingExpected: true, loadersLength: 2, loadersCount: 2 },   // 0 : 1,3       add
        { tickCount: 1, loadingExpected: true, loadersLength: 2, loadersCount: 1 },   // 1 : 0,2
        { tickCount: 1, loadingExpected: true, loadersLength: 2, loadersCount: 1 },   // 2 : 0,1
        { tickCount: 1, loadingExpected: false, loadersLength: 2, loadersCount: 0 }   // 3 : 0,0
      ],
      changes: 2,
    },
    {
      name: 'multiple sync time',
      loaders: [
        { start: 0, duration: 2 },
        { start: 1, duration: 4 },
        { start: 3, duration: 1 },
        { start: 6, duration: 2 },
      ],
      ticks: [
        { tickCount: 0, loadingExpected: true, loadersLength: 1, loadersCount: 1 },   // 0 : 2
        { tickCount: 1, loadingExpected: true, loadersLength: 2, loadersCount: 2 },   // 1 : 1,4         add
        { tickCount: 1, loadingExpected: true, loadersLength: 2, loadersCount: 1 },   // 2 : 0,3
        { tickCount: 1, loadingExpected: true, loadersLength: 3, loadersCount: 2 },   // 3 : 0,2,1       add
        { tickCount: 1, loadingExpected: true, loadersLength: 3, loadersCount: 1 },   // 4 : 0,1,0
        { tickCount: 1, loadingExpected: false, loadersLength: 3, loadersCount: 0 },  // 5 : 0,0
        { tickCount: 1, loadingExpected: true, loadersLength: 1, loadersCount: 1 },   // 6 : 2           add
        { tickCount: 1, loadingExpected: true, loadersLength: 1, loadersCount: 1 },   // 7 : 1
        { tickCount: 1, loadingExpected: false, loadersLength: 1, loadersCount: 0 }   // 8 : 0
      ],
      changes: 4,
    }
  ]

  beforeEach(() => {
    signalTesting = setUpSignalTesting();
    jest.useFakeTimers();
  })

  it.each(testValues)(
    "$name",
    (test) => {
      signalTesting.runInTestingInjectionContext((component: NoopComponent, injector: Injector, changeDetectorRef: ChangeDetectorRef) => {
        //const smartLoader = new SmartLoader(changeDetectorRef, injector);
        const smartLoader = component.smartLoader;

        effect(
          () => {
            console.log("effect loading", test.name, smartLoader.loading())

            expect(smartLoader.loading()).toBeDefined();
          },
          //{ injector: component.injector }
          //{ injector }
        );

        test.loaders.forEach((loader) => {
          setTimeout(() => {
            smartLoader.addLoader(loader.duration * tickDuration);
          }, loader.start * tickDuration);
        })

        test.ticks.forEach((tick) => {
          jest.advanceTimersByTime(tick.tickCount * tickDuration);
          expect(smartLoader.loading()).toBe(tick.loadingExpected);
          expect(smartLoader['length']).toBe(tick.loadersLength);
          expect(smartLoader['count']()).toBe(tick.loadersCount);
        })

        expect.assertions(test.ticks.length * 3 + test.changes);
      });
    }
  );

  afterEach(() => {
    jest.useRealTimers()
  })
});