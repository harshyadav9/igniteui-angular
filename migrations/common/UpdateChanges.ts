// tslint:disable-next-line:no-implicit-dependencies
import { FileEntry, SchematicContext, Tree } from "@angular-devkit/schematics";

import * as fs from "fs";
import * as path from "path";
import { ClassChanges, OutputChanges, SelectorChange, SelectorChanges } from "./schema";
import { getIdentifierPositions } from "./tsUtils";

// tslint:disable:arrow-parens
export class UpdateChanges {
    protected classChanges: ClassChanges;
    protected outputChanges: OutputChanges;
    protected selectorChanges: SelectorChanges;

    private _templateFiles: FileEntry[] = [];
    public get templateFiles(): FileEntry[] {
        if (!this._templateFiles.length) {
            // https://github.com/angular/devkit/blob/master/packages/angular_devkit/schematics/src/tree/filesystem.ts
            this.host.visit((fulPath, entry) => {
                if (fulPath.endsWith("component.html")) {
                    this._templateFiles.push(entry);
                }
            });
        }
        return this._templateFiles;
    }

    private _tsFiles: FileEntry[] = [];
    public get tsFiles(): FileEntry[] {
        if (!this._tsFiles.length) {
            this.host.visit((fulPath, entry) => {
                if (fulPath.endsWith(".ts")) {
                    this._tsFiles.push(entry);
                }
            });
        }
        return this._tsFiles;
    }

    /**
     * Create a new base schematic to apply changes
     * @param rootPath Root folder for the schematic to read configs, pass __dirname
     */
    constructor(private rootPath: string, private host: Tree, private context?: SchematicContext) {
        const selectorJson = path.join(this.rootPath, "changes", "selectors.json");
        if (fs.existsSync(selectorJson)) {
            this.selectorChanges = JSON.parse(fs.readFileSync(selectorJson, "utf-8"));
        }
        const classJson = path.join(this.rootPath, "changes", "classes.json");
        if (fs.existsSync(classJson)) {
            this.classChanges = JSON.parse(fs.readFileSync(classJson, "utf-8"));
        }
        const outputsJson = path.join(this.rootPath, "changes", "outputs.json");
        if (fs.existsSync(outputsJson)) {
            this.outputChanges = JSON.parse(fs.readFileSync(outputsJson, "utf-8"));
        }
    }

    /** Apply configured changes to the Host Tree */
    public applyChanges() {
        if (this.selectorChanges && this.selectorChanges.changes.length) {
            for (const entry of this.templateFiles) {
                this.updateSelectors(entry);
            }
        }
        if (this.outputChanges && this.outputChanges.changes.length) {
            for (const entry of this.templateFiles) {
                this.updateOutputs(entry);
            }
        }

        /** TS files */
        if (this.classChanges && this.classChanges.changes.length) {
            for (const entry of this.tsFiles) {
                this.updateClasses(entry);
            }
        }
    }

    protected updateSelectors(entry: FileEntry) {
        let fileContent = entry.content.toString();
        let overwrite = false;
        for (const change of this.selectorChanges.changes) {
            let searchPttrn = change.type === "component" ? "<" : "";
            searchPttrn += change.selector;
            if (fileContent.indexOf(searchPttrn) !== -1) {
                fileContent = this.applySelectorChange(fileContent, change);
                overwrite = true;
            }
        }
        if (overwrite) {
            this.host.overwrite(entry.path, fileContent);
        }
    }

    protected applySelectorChange(fileContent: string, change: SelectorChange): string {
        let regSource: string;
        let replace: string;
        switch (change.type) {
            case "component":
                if (change.remove) {
                    regSource = String.raw`\<${change.selector}[\s\S]*?\<\/${change.selector}\>`;
                    replace = "";
                } else {
                    regSource = String.raw`\<(\/?)${change.selector}`;
                    replace = `<$1${change.replaceWith}`;
                }
                break;
            case "directive":
                if (change.remove) {
                    regSource = String.raw`\s*?\[?${change.selector}\]?(=(["']).*?\2(?=\s|\>))?`;
                    replace = "";
                } else {
                    regSource = change.selector;
                    replace = change.replaceWith;
                }
                break;
            default:
                break;
        }
        fileContent = fileContent.replace(new RegExp(regSource, "g"), replace);
        return fileContent;
    }

    protected updateClasses(entry: FileEntry) {
        let fileContent = entry.content.toString();
        let overwrite = false;
        for (const change of this.classChanges.changes) {
            if (fileContent.indexOf(change.name) !== -1) {
                const positions = getIdentifierPositions(fileContent, change.name);
                // loop backwards to preserve positions
                for (let i = positions.length; i--;) {
                    const pos = positions[i];
                    fileContent = fileContent.slice(0, pos.start) + change.replaceWith + fileContent.slice(pos.end);
                }
                // fileContent = fileContent.replace(new RegExp(change.name, "g"), change.replaceWith);
                overwrite = true;
            }
        }
        if (overwrite) {
            this.host.overwrite(entry.path, fileContent);
        }
    }

    protected updateOutputs(entry: FileEntry) {
        let fileContent = entry.content.toString();
        let overwrite = false;
        for (const change of this.outputChanges.changes) {
            if (fileContent.indexOf(change.owner.selector) !== -1 && fileContent.indexOf(change.name) !== -1) {
                let reg = new RegExp(String.raw`\(${change.name}\)`, "g");
                let replace = `(${change.replaceWith})`;
                let searchPattern;

                if (change.remove) {
                    reg = new RegExp(String.raw`\s*\(${change.name}\)=(["']).*?\1(?=\s|\>)`, "g");
                    replace = "";
                }
                switch (change.owner.type) {
                case "component":
                    searchPattern = String.raw`\<${change.owner.selector}[^\>]*\>`;
                    break;
                case "directive":
                    searchPattern = String.raw`\<[^\>]*[\s\[]${change.owner.selector}[^\>]*\>`;
                    break;
                }

                const matches = fileContent.match(new RegExp(searchPattern, "g"));

                for (const match of matches) {
                    fileContent = fileContent.replace(
                        match,
                        match.replace(reg, replace)
                    );
                }
                overwrite = true;
            }
        }
        if (overwrite) {
            this.host.overwrite(entry.path, fileContent);
        }
    }
}
