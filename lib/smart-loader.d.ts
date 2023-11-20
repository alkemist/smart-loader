import { ChangeDetectorRef, Injector, Signal } from "@angular/core";
declare class LoaderModel {
    protected _id: number;
    protected timing: number;
    private changeDetectorRef?;
    constructor(_id: number, timing?: number, changeDetectorRef?: ChangeDetectorRef | undefined);
    private _terminated;
    get terminated(): Signal<boolean>;
    get id(): number;
    delay(): void;
    finish(): void;
}
export declare class SmartLoader {
    private changeDetectorRef?;
    private readonly _loading;
    private readonly _count;
    private readonly _loaders;
    constructor(changeDetectorRef?: ChangeDetectorRef | undefined, injector?: Injector);
    get loading(): Signal<boolean>;
    get count(): Signal<number>;
    private get length();
    addLoader(timing?: number): LoaderModel;
}
export {};
//# sourceMappingURL=smart-loader.d.ts.map