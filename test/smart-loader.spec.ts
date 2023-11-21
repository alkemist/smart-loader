import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { SmartLoader } from '../src/smart-loader.js';
import { setUpSignalTesting, SignalTesting } from './setup-effect.js';
import { Poller } from '../src/poller';

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
    }
  ]

  beforeEach(() => {
    signalTesting = setUpSignalTesting();
    jest.useFakeTimers();
  })

  it.each(testValues)(
    "$name",
    (test) => {
      signalTesting.runInTestingInjectionContext(() => {
        const smartLoader = new SmartLoader();

        test.loaders.forEach((loader) => {
          setTimeout(() => {
            smartLoader.addLoader(loader.duration * tickDuration);
          }, loader.start * tickDuration);
        })

        test.ticks.forEach((tick) => {
          jest.advanceTimersByTime(tick.tickCount * tickDuration);
          expect(smartLoader.loading()).toBe(tick.loadingExpected);
          expect(smartLoader['length']).toBe(tick.loadersLength);
          expect(smartLoader.count()).toBe(tick.loadersCount);
        })

        expect.assertions(test.ticks.length * 3);
      });
    }
  );

  describe('polling', () => {
    const pollingTime = 2;
    const pollingEnd = 10;
    const pollingEventStart = 5;
    const pollingEventTime = 2;
    const tickOffset = 100;

    it('method 1', () => {
      signalTesting.runInTestingInjectionContext((component, injector, fixture) => {
        const smartLoader = new SmartLoader();

        const ticks = [
          { count: 1, loading: true },
          { count: 1, loading: true },
          { count: 1, loading: true },
          { count: 1, loading: true },
          { count: 2, loading: true },
          { count: 1, loading: true },
          { count: 1, loading: true },
          { count: 1, loading: true },
          { count: 1, loading: true },
          { count: 0, loading: false },
        ]

        expect(smartLoader.loading()).toBe(false);
        expect(smartLoader.count()).toBe(0);

        smartLoader.startPolling(injector, pollingTime * tickDuration);

        setTimeout(() => {
          smartLoader.addLoader(pollingEventTime)
          //console.log('[Loader]', 'Add')
        }, pollingEventStart * tickDuration)

        setTimeout(() => {
          smartLoader.clean();
        }, pollingEnd * tickDuration)

        expect(smartLoader.loading()).toBe(true);
        expect(smartLoader.count()).toBe(1);

        ticks.forEach((tick) => {
          jest.advanceTimersByTime(tickDuration);
          signalTesting.flushEffects();

          expect(smartLoader.loading()).toBe(tick.loading);
          expect(smartLoader.count()).toBe(tick.count);
        })

        expect.assertions((ticks.length * 2) + 4);
      })
    })

    it('method 2', () => {
      signalTesting.runInTestingInjectionContext((component, injector, fixture) => {
        const ticks = [
          { count: 1 },
          { count: 1 },
          { count: 1 },
          { count: 1 },
          { count: 1 },
          { count: 1 },
          { count: 1 },
          { count: 1 },
          { count: 1 },
        ];
        let currentTicks = 1;

        const callback = (): Promise<void> => {
          return new Promise(resolve => {
            console.log('[Callback] Begin', currentTicks)
            setTimeout(() => {
              console.log('[Callback] End', currentTicks)
              resolve();
            }, currentTicks * tickDuration)
          })
        }

        const smartPolling = new Poller(
          injector,
          pollingTime * tickDuration,
          callback
        );
        smartPolling.start();
        signalTesting.flushEffects();

        setTimeout(() => {
          smartPolling.pause();
        }, pollingEnd * tickDuration)

        ticks.forEach((tick, index) => {
          console.log('[Tick]', index, tick);
          currentTicks = tick.count;

          jest.advanceTimersByTime(tickDuration);
          signalTesting.flushEffects();
        });

        expect.assertions(0);
      })
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })
});