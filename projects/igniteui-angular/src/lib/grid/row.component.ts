import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    DoCheck,
    ElementRef,
    forwardRef,
    HostBinding,
    HostListener,
    Input,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import { take } from 'rxjs/operators';
import { IgxCheckboxComponent } from '../checkbox/checkbox.component';
import { IgxSelectionAPIService } from '../core/selection';
import { IgxForOfDirective } from '../directives/for-of/for_of.directive';
import { IgxGridAPIService } from './api.service';
import { IgxGridCellComponent } from './cell.component';
import { IgxColumnComponent } from './column.component';
import { IgxGridComponent, IRowSelectionEventArgs } from './grid.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    selector: 'igx-grid-row',
    templateUrl: './row.component.html'
})
export class IgxGridRowComponent implements DoCheck {

    @Input()
    public rowData: any;

    @Input()
    public index: number;

    @Input()
    public gridID: string;

    @ViewChild('igxDirRef', { read: IgxForOfDirective })
    public virtDirRow: IgxForOfDirective<any>;

    @ViewChild(forwardRef(() => IgxCheckboxComponent), {read: IgxCheckboxComponent})
    public checkboxElement: IgxCheckboxComponent;

    @ViewChildren(forwardRef(() => IgxGridCellComponent), { read: IgxGridCellComponent })
    public cells: QueryList<IgxGridCellComponent>;

    @HostBinding('style.height.px')
    get rowHeight() {
        return this.grid.rowHeight;
    }
    @HostBinding('attr.tabindex')
    public tabindex = 0;

    @HostBinding('attr.role')
    public role = 'row';

    @HostBinding('class')
    get styleClasses(): string {
        return `${this.defaultCssClass} ${this.index % 2 ? this.grid.evenRowCSS : this.grid.oddRowCSS}`;
    }

    get focused(): boolean {
        return this.isFocused;
    }

    set focused(val: boolean) {
        this.isFocused = val;
    }

    get columns(): IgxColumnComponent[] {
        return this.grid.visibleColumns;
    }

    get pinnedColumns(): IgxColumnComponent[] {
        return this.grid.pinnedColumns;
    }

    get unpinnedColumns(): IgxColumnComponent[] {
        return this.grid.unpinnedColumns;
    }

    public get rowSelectable() {
        return this.grid.rowSelectable;
    }

    @HostBinding('attr.aria-selected')
    @HostBinding('class.igx-grid__tr--selected')
    public isSelected: boolean;

    get grid(): IgxGridComponent {
        return this.gridAPI.get(this.gridID);
    }

    public get rowID() {
        // A row in the grid is identified either by:
        // primaryKey data value,
        // or if the primaryKey is omitted, then the whole rowData is used instead.
        const primaryKey = this.grid.primaryKey;
        return primaryKey ? this.rowData[primaryKey] : this.rowData;
    }

    get nativeElement() {
        return this.element.nativeElement;
    }

    protected defaultCssClass = 'igx-grid__tr';
    protected _rowSelection = false;
    protected isFocused = false;

    constructor(public gridAPI: IgxGridAPIService,
                private selectionAPI: IgxSelectionAPIService,
                public element: ElementRef,
                public cdr: ChangeDetectorRef) { }


    @HostListener('focus', ['$event'])
    public onFocus(event) {
        this.isFocused = true;
    }

    @HostListener('blur', ['$event'])
    public onBlur(event) {
        this.isFocused = false;
    }

    public onCheckboxClick(event) {
        const newSelection = (event.checked) ?
                            this.selectionAPI.select_item(this.gridID, this.rowID) :
                            this.selectionAPI.deselect_item(this.gridID, this.rowID);
        this.grid.triggerRowSelectionChange(newSelection, this, event);
    }

    get rowCheckboxAriaLabel() {
        return this.grid.primaryKey ?
            this.isSelected ? 'Deselect row with key ' + this.rowID : 'Select row with key ' + this.rowID :
            this.isSelected ? 'Deselect row' : 'Select row';
    }

    public ngDoCheck() {
        this.isSelected = this.rowSelectable ?
            this.grid.allRowsSelected ? true : this.selectionAPI.is_item_selected(this.gridID, this.rowID) :
            this.selectionAPI.is_item_selected(this.gridID, this.rowID);
        this.cdr.markForCheck();
        if (this.checkboxElement) {
            this.checkboxElement.checked = this.isSelected;
        }
    }

    notGroups(arr) {
        return arr.filter(c => !c.columnGroup);
    }
}
