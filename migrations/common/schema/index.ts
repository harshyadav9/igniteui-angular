// generate schema:
// npx typescript-json-schema migrations/common/schema/index.ts SelectorChanges -o migrations/common/schema/selector.schema.json --required

// tslint:disable:interface-name
export interface SelectorChanges {
    /** An array of changes to component/directive selectors */
    changes: SelectorChange[];
}
export interface SelectorChange extends TemplateElement, ChangeAction {}

export interface OutputChanges {
    /** An array of changes to output properties */
    changes: OutputChange[];
}
export interface OutputChange extends ChangeAction {
    /** Name of the output property to change */
    name: string;
    /** Component that emits the output */
    owner: TemplateElement;
}

export interface ClassChanges {
    /** An array of changes to output properties */
    changes: ClassChange[];
}
export interface ClassChange {
    /** Name of the class to change */
    name: string;
    /** Replace original name with new one */
    replaceWith: string;
}

interface ChangeAction {
    /** Replace original selector with new one */
    replaceWith?: string;
    /** Remove directive/component */
    remove?: boolean;
}

interface TemplateElement {
    /** Type of selector the change applies to - either component or directive */
    type: ElementType;
    /** Original selector to apply change to */
    selector: string;
}

enum ElementType {
    directive = "directive",
    component = "component"
}
