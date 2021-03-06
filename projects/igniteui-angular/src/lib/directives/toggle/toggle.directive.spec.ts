import { ChangeDetectionStrategy, Component, DebugElement, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { async, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxToggleActionDirective, IgxToggleDirective, IgxToggleModule } from './toggle.directive';
import { IgxOverlayService } from '../../services';

describe('IgxToggle', () => {
    const HIDDEN_TOGGLER_CLASS = 'igx-toggle--hidden';
    const TOGGLER_CLASS = 'igx-toggle';
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxToggleActionTestComponent,
                IgxToggleServiceInjectComponent,
                IgxOverlayServiceComponent,
                IgxToggleTestComponent,
                TestWithOnPushComponent
            ],
            imports: [NoopAnimationsModule, IgxToggleModule]
        })
        .compileComponents();
    }));

    it('IgxToggleDirective is defined', () => {
        const fixture = TestBed.createComponent(IgxToggleTestComponent);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(IgxToggleDirective))).toBeDefined();
        expect(fixture.debugElement.query(By.css('ul'))).toBeDefined();
        expect(fixture.debugElement.queryAll(By.css('li')).length).toBe(4);
    });

    it('verify that initially toggled content is hidden', () => {
        const fixture = TestBed.createComponent(IgxToggleTestComponent);
        fixture.detectChanges();
        const divEl = fixture.debugElement.query(By.directive(IgxToggleDirective)).nativeElement;
        expect(fixture.componentInstance.isClosed).toBe(true);
        expect(divEl.classList.contains(HIDDEN_TOGGLER_CLASS)).toBeTruthy();
    });

    it('should show and hide contenct according \'collapsed\' attribute', () => {
        const fixture = TestBed.createComponent(IgxToggleTestComponent);
        fixture.detectChanges();

        const divEl = fixture.debugElement.query(By.directive(IgxToggleDirective)).nativeElement;
        expect(fixture.componentInstance.isClosed).toBe(true);
        expect(divEl.classList.contains(HIDDEN_TOGGLER_CLASS)).toBeTruthy();
        fixture.componentInstance.isClosed = false;
        fixture.detectChanges();

        expect(fixture.componentInstance.isClosed).toBe(false);
        expect(divEl.classList.contains(TOGGLER_CLASS)).toBeTruthy();
    });

    it('should emit \'onOpened\' event', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxToggleTestComponent);
        fixture.detectChanges();

        const toggle = fixture.componentInstance.toggle;
        spyOn(toggle.onOpened, 'emit');
        toggle.open(true);
        tick();
        fixture.detectChanges();

        expect(toggle.onOpened.emit).toHaveBeenCalled();
    }));

    it('should emit \'onClosed\' event', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxToggleTestComponent);
        fixture.detectChanges();

        const toggle = fixture.componentInstance.toggle;
        fixture.componentInstance.isClosed = false;
        fixture.detectChanges();

        spyOn(toggle.onClosed, 'emit');
        toggle.close(true);
        tick();
        fixture.detectChanges();

        expect(toggle.onClosed.emit).toHaveBeenCalled();
    }));

    it('should propagate IgxOverlay onOpened/onClosed events', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxOverlayServiceComponent);
        fixture.detectChanges();

        const toggle = fixture.componentInstance.toggle;
        const overlay = fixture.componentInstance.overlay;
        spyOn(toggle.onOpened, 'emit');
        spyOn(toggle.onClosed, 'emit');

        toggle.open();
        tick();
        expect(toggle.onOpened.emit).toHaveBeenCalledTimes(0);
        expect(toggle.collapsed).toBe(false);
        toggle.close();
        tick();
        expect(toggle.onClosed.emit).toHaveBeenCalledTimes(0);
        expect(toggle.collapsed).toBe(true);

        toggle.open(true);
        tick();
        expect(toggle.onOpened.emit).toHaveBeenCalledTimes(1);
        const otherId = overlay.show(fixture.componentInstance.other);
        overlay.hide(otherId);
        tick();
        expect(toggle.onClosed.emit).toHaveBeenCalledTimes(0);
        expect(toggle.collapsed).toBe(false);
        overlay.hideAll(); // as if outside click
        tick();
        expect(toggle.onClosed.emit).toHaveBeenCalledTimes(1);
        expect(toggle.collapsed).toBe(true);
    }));

    it('should open toggle when IgxToggleActionDiretive is clicked and toggle is closed', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxToggleActionTestComponent);
        fixture.detectChanges();
        fixture.debugElement.componentInstance.isClosed = true;
        tick();
        fixture.detectChanges();

        const button: DebugElement = fixture.debugElement.query(By.directive(IgxToggleActionDirective));
        const divEl: DebugElement = fixture.debugElement.query(By.directive(IgxToggleDirective));
        expect(fixture.debugElement.componentInstance.isClosed).toBeTruthy();
        expect(divEl.classes[HIDDEN_TOGGLER_CLASS]).toBeTruthy();
        button.triggerEventHandler('click', null);
        tick();
        fixture.detectChanges();

        expect(divEl.classes[TOGGLER_CLASS]).toBeTruthy();
    }));
    it('should close toggle when IgxToggleActionDiretive is clicked and toggle is opened', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxToggleActionTestComponent);
        fixture.detectChanges();

        const divEl = fixture.debugElement.query(By.directive(IgxToggleDirective)).nativeElement;
        const button: DebugElement = fixture.debugElement.query(By.directive(IgxToggleActionDirective));

        expect(divEl.classList.contains(TOGGLER_CLASS)).toBeTruthy();

        button.triggerEventHandler('click', null);

        fixture.whenStable().then(() => {
            tick();
            fixture.detectChanges();
            expect(divEl.classList.contains(HIDDEN_TOGGLER_CLASS)).toBeTruthy();
        });
    }));

    it('should hide content and emit \'onClosed\' event when you click outside the toggler\'s content', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxToggleActionTestComponent);
        fixture.detectChanges();

        const divEl = fixture.debugElement.query(By.directive(IgxToggleDirective)).nativeElement;
        const toggle = fixture.componentInstance.toggle;
        const p = fixture.debugElement.query(By.css('p'));

        expect(fixture.debugElement.componentInstance.isClosed).toBeFalsy();
        expect(divEl.classList.contains(TOGGLER_CLASS)).toBeTruthy();
        spyOn(toggle.onClosed, 'emit');
        p.nativeElement.click();
        tick();
        fixture.detectChanges();

        expect(toggle.onClosed.emit).toHaveBeenCalled();
    }));

    it('Toggle should be registered into navigaitonService if it is passed through identifier', fakeAsync(() => {
        const fixture = TestBed.createComponent(IgxToggleServiceInjectComponent);
        fixture.detectChanges();

        const toggleFromComponent = fixture.componentInstance.toggle;
        const toggleFromService = fixture.componentInstance.toggleAction.target as IgxToggleDirective;

        expect(toggleFromService instanceof IgxToggleDirective).toBeTruthy();
        expect(toggleFromService.id).toEqual(toggleFromComponent.id);
    }));

    it('Toggle should working with parrent component and OnPush strategy applied.', fakeAsync(() => {
        const fix = TestBed.createComponent(TestWithOnPushComponent);
        fix.detectChanges();

        const toggle = fix.componentInstance.toggle;
        const toggleElm = fix.debugElement.query(By.directive(IgxToggleDirective)).nativeElement;
        const button: DebugElement = fix.debugElement.query(By.css('button'));

        spyOn(toggle.onOpened, 'emit');
        spyOn(toggle.onClosed, 'emit');
        button.triggerEventHandler('click', null);

        fix.whenStable().then(() => {
            tick();
            fix.detectChanges();

            expect(toggle.onOpened.emit).toHaveBeenCalled();
            expect(toggleElm.classList.contains(TOGGLER_CLASS)).toBe(true);
        }).then(() => {
            button.triggerEventHandler('click', null);

            tick();
            fix.detectChanges();

            expect(toggle.onClosed.emit).toHaveBeenCalled();
            expect(toggleElm.classList.contains(HIDDEN_TOGGLER_CLASS)).toBe(true);
        });
    }));
});

@Component({
    template: `
    <div igxToggle #toggleRef="toggle" [collapsed]="isClosed" (onOpen)="open()" (onClose)="close()">
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
        <li>4</li>
      </ul>
    </div>
    `
})
export class IgxToggleTestComponent {
    @ViewChild(IgxToggleDirective) public toggle: IgxToggleDirective;
    public isClosed = true;
    public open() {}
    public close() {}
}
@Component({
    template: `
    <button [igxToggleAction]="toggleRef"
    [closeOnOutsideClick]="outsideClickClose">Open/Close Toggle</button>
    <div igxToggle #toggleRef="toggle" [collapsed]="isClosed">
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
        <li>4</li>
      </ul>
    </div>
    <p>Test</p>
    `
})
export class IgxToggleActionTestComponent {
    public isClosed = false;
    public outsideClickClose = true;
    @ViewChild(IgxToggleDirective) public toggle: IgxToggleDirective;
    @ViewChild(IgxToggleActionDirective) public toggleAction: IgxToggleActionDirective;
}

@Component({
    template: `
        <button igxToggleAction="toggleID">Open/Close Toggle</button>
        <div igxToggle id="toggleID">
            <p>Some content</p>
        </div>
    `
})
export class IgxToggleServiceInjectComponent {
    @ViewChild(IgxToggleDirective) public toggle: IgxToggleDirective;
    @ViewChild(IgxToggleActionDirective) public toggleAction: IgxToggleActionDirective;
}

@Component({
    template: `
        <div igxToggle id="toggleID">
            <p>Some content</p>
        </div>
        <div #other> <p>Some more content</p> </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IgxOverlayServiceComponent {
    @ViewChild(IgxToggleDirective) public toggle: IgxToggleDirective;
    @ViewChild(`other`) public other: ElementRef;
    /**
     *
     */
    constructor(public overlay: IgxOverlayService) {}
}


@Component({
    template: `
        <button igxToggleAction="toggleID">Open/Close Toggle</button>
        <div igxToggle id="toggleID">
            <p>Some content</p>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestWithOnPushComponent {
    @ViewChild(IgxToggleDirective) public toggle: IgxToggleDirective;
}
