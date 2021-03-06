import {
    AfterContentInit,
    AfterViewChecked,
    Component,
    ContentChild,
    ElementRef,
    forwardRef,
    HostBinding,
    Inject,
    Input,
    TemplateRef,
    HostListener
} from '@angular/core';

import { IgxTabItemComponent } from './tab-item.component';
import { IgxTabsComponent } from './tabs.component';
import { IgxTabItemTemplateDirective } from './tabs.directives';

@Component({
    selector: 'igx-tabs-group',
    templateUrl: 'tabs-group.component.html'
})

export class IgxTabsGroupComponent implements AfterContentInit, AfterViewChecked {
    public isSelected = false;

    /**
    * An @Input property that sets the value of the `label`.
    *```typescript
    *<igx-tabs-group label="Tab 1" icon="folder">
    *```
    */
    @Input()
    public label: string;

    /**
    * An @Input property that sets the value of the `icon`.
    * The value should be valid icon name from {@link https://material.io/tools/icons/?style=baseline}.
    *```html
    *<igx-tabs-group label="Tab 1" icon="home">
    *```
    */
    @Input()
    public icon: string;

    /**
    * An @Input property that allows you to enable/disable the `IgxTabGroupComponent`.
    *```html
    *<igx-tabs-group label="Tab 2  Lorem ipsum dolor sit" icon="home" [disabled]="true">
    *```
    */
    @Input()
    public disabled: boolean;

    /**
     * @hidden
     */
    @HostBinding('attr.role')
    public role = 'tabpanel';

    /**
     * @hidden
     */
    @HostBinding('class')
    get styleClass(): string {
        return 'igx-tabs__group';
    }

    /**
     * An accessor that returns the `IgxTabItemComponent` component.
     * ```typescript
     * @ViewChild("MyTabsGroup")
     * public tab: IgxTabsGroupComponent;
     * ngAfterViewInIt(){
     *    let tabComponent = this.tab.relatedTab;
     * }
     * ```
     */
    get relatedTab(): IgxTabItemComponent {
        if (this._tabs.tabs) {
            return this._tabs.tabs.toArray()[this.index];
        }
    }

    /**
     * An accessor that returns the value of the index of the `IgxTabsGroupComponent`.
     * ```typescript
     * @ViewChild("MyTabsGroup")
     * public tab: IgxTabsGroupComponent;
     * ngAfterViewInIt(){
     *    let tabIndex = this.tab.index;
     * }
     * ```
     */
    get index() {
        if (this._tabs.groups) {
            return this._tabs.groups.toArray().indexOf(this);
        }
    }

    /**
     * @hidden
     */
    get customTabTemplate(): TemplateRef<any> {
        return this._tabTemplate;
    }

    /**
     *@hidden
     */
    set customTabTemplate(template: TemplateRef<any>) {
        this._tabTemplate = template;
    }

    private _tabTemplate: TemplateRef<any>;

    /**
     * @hidden
     */
    @ContentChild(IgxTabItemTemplateDirective, { read: IgxTabItemTemplateDirective })
    protected tabTemplate: IgxTabItemTemplateDirective;

    constructor(
        @Inject(forwardRef(() => IgxTabsComponent))
        private _tabs: IgxTabsComponent,
        private _element: ElementRef) {
    }


    @HostListener('window:resize', ['$event'])
    public onResize(event) {
        if (this.isSelected) {
            const contentOffset = this._tabs.tabsContainer.nativeElement.offsetWidth * this.index;
            this._tabs.contentsContainer.nativeElement.style.transitionDuration = `0s`;
            this._tabs.contentsContainer.nativeElement.style.transform = `translate(${-contentOffset}px)`;
        }
    }

    /**
     * @hidden
     */
    public ngAfterContentInit(): void {
        if (this.tabTemplate) {
            this._tabTemplate = this.tabTemplate.template;
        }
    }

    /**
     * @hidden
     */
    public ngAfterViewChecked() {
        this._element.nativeElement.setAttribute('aria-labelledby', `igx-tab-item-${this.index}`);
        this._element.nativeElement.setAttribute('id', `igx-tabs__group-${this.index}`);
    }

    /**
     * A method that sets the focus on a tab.
     * @memberOf {@link IgxTabGroupComponent}
     *```typescript
     *@ViewChild("MyChild")
     *public tab : IgxTabsGroupComponent;
     *ngAfterViewInit(){
     *    this.tab.select();
     *}
     *```
     * @param focusDelay A number representing the expected delay.
     */
    public select(focusDelay = 50, onInit = false) {
        if (this.disabled || this._tabs.selectedIndex === this.index) {
            return;
        }

        this.isSelected = true;
        this.relatedTab.tabindex = 0;

        if (!onInit) {
            setTimeout(() => {
                this.relatedTab.nativeTabItem.nativeElement.focus();
            }, focusDelay);
        }
        this._handleSelection();
        this._tabs.onTabItemSelected.emit({ tab: this._tabs.tabs.toArray()[this.index], group: this });
    }

    private _handleSelection() {
        const tabElement = this.relatedTab.nativeTabItem.nativeElement;
        const viewPortOffsetWidth = this._tabs.viewPort.nativeElement.offsetWidth;

        if (tabElement.offsetLeft < this._tabs.offset) {
            this._tabs.scrollElement(tabElement, false);
        } else if (tabElement.offsetLeft + tabElement.offsetWidth > viewPortOffsetWidth + this._tabs.offset) {
            this._tabs.scrollElement(tabElement, true);
        }

        const contentOffset = this._tabs.tabsContainer.nativeElement.offsetWidth * this.index;
        this._tabs.contentsContainer.nativeElement.style.transitionDuration = `0.2s`;
        this._tabs.contentsContainer.nativeElement.style.transform = `translate(${-contentOffset}px)`;

        this._tabs.selectedIndicator.nativeElement.style.width = `${tabElement.offsetWidth}px`;
        this._tabs.selectedIndicator.nativeElement.style.transform = `translate(${tabElement.offsetLeft}px)`;
    }
}
