/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import { PluginContribution, IndentationRules, FoldingRules, ScopeMap } from '../../common';
import { TextmateRegistry, getEncodedLanguageId } from '@theia/monaco/lib/browser/textmate';
import { ITokenTypeMap, IEmbeddedLanguagesMap, StandardTokenType } from 'monaco-textmate';

@injectable()
export class PluginContributionHandler {

    private injections = new Map<string, string[]>();

    @inject(TextmateRegistry)
    private readonly grammarsRegistry: TextmateRegistry;
    constructor() {

    }

    handleContributions(contributions: PluginContribution): void {
        if (contributions.languages) {
            for (const lang of contributions.languages) {
                monaco.languages.register({
                    id: lang.id,
                    aliases: lang.aliases,
                    extensions: lang.extensions,
                    filenamePatterns: lang.filenamePatterns,
                    filenames: lang.filenames,
                    firstLine: lang.firstLine,
                    mimetypes: lang.mimetypes
                });
                if (lang.configuration) {
                    monaco.languages.setLanguageConfiguration(lang.id, {
                        wordPattern: this.createRegex(lang.configuration.wordPattern),
                        autoClosingPairs: lang.configuration.autoClosingPairs,
                        brackets: lang.configuration.brackets,
                        comments: lang.configuration.comments,
                        folding: this.convertFolding(lang.configuration.folding),
                        surroundingPairs: lang.configuration.surroundingPairs,
                        indentationRules: this.convertIndentationRules(lang.configuration.indentationRules)
                    });
                }
            }
        }

        if (contributions.grammars) {
            for (const grammar of contributions.grammars) {
                if (grammar.injectTo) {
                    for (const injectScope of grammar.injectTo) {
                        let injections = this.injections.get(injectScope);
                        if (!injections) {
                            injections = [];
                            this.injections.set(injectScope, injections);
                        }
                        injections.push(grammar.scope);
                    }
                }

                this.grammarsRegistry.registerTextmateGrammarScope(grammar.scope, {
                    async getGrammarDefinition() {
                        return {
                            format: grammar.format,
                            content: grammar.grammar || '',
                        };
                    },
                    getInjections: (scopeName: string) =>
                        this.injections.get(scopeName)!
                });
                if (grammar.language) {
                    this.grammarsRegistry.mapLanguageIdToTextmateGrammar(grammar.language, grammar.scope);
                    this.grammarsRegistry.registerGrammarConfiguration(grammar.language, {
                        embeddedLanguages: this.convertEmbeddedLanguages(grammar.embeddedLanguages),
                        tokenTypes: this.convertTokenTypes(grammar.tokenTypes)
                    });
                }
            }
        }
    }

    private createRegex(value: string | undefined): RegExp | undefined {
        if (typeof value === 'string') {
            return new RegExp(value, '');
        }
        return undefined;
    }

    private convertIndentationRules(rules?: IndentationRules): monaco.languages.IndentationRule | undefined {
        if (!rules) {
            return undefined;
        }
        return {
            decreaseIndentPattern: this.createRegex(rules.decreaseIndentPattern)!,
            increaseIndentPattern: this.createRegex(rules.increaseIndentPattern)!,
            indentNextLinePattern: this.createRegex(rules.indentNextLinePattern),
            unIndentedLinePattern: this.createRegex(rules.unIndentedLinePattern)
        };
    }

    private convertFolding(folding?: FoldingRules): monaco.languages.FoldingRules | undefined {
        if (!folding) {
            return undefined;
        }
        const result: monaco.languages.FoldingRules = {
            offSide: folding.offSide
        };

        if (folding.markers) {
            result.markers = {
                end: this.createRegex(folding.markers.end)!,
                start: this.createRegex(folding.markers.start)!
            };
        }

        return result;

    }

    private convertTokenTypes(tokenTypes?: ScopeMap): ITokenTypeMap | undefined {
        if (typeof tokenTypes === 'undefined' || tokenTypes === null) {
            return undefined;
        }
        // tslint:disable-next-line:no-null-keyword
        const result = Object.create(null);
        const scopes = Object.keys(tokenTypes);
        const len = scopes.length;
        for (let i = 0; i < len; i++) {
            const scope = scopes[i];
            const tokenType = tokenTypes[scope];
            switch (tokenType) {
                case 'string':
                    result[scope] = StandardTokenType.String;
                    break;
                case 'other':
                    result[scope] = StandardTokenType.Other;
                    break;
                case 'comment':
                    result[scope] = StandardTokenType.Comment;
                    break;
            }
        }
        return result;
    }

    private convertEmbeddedLanguages(languages?: ScopeMap): IEmbeddedLanguagesMap | undefined {
        if (typeof languages === 'undefined' || languages === null) {
            return undefined;
        }

        // tslint:disable-next-line:no-null-keyword
        const result = Object.create(null);
        const scopes = Object.keys(languages);
        const len = scopes.length;
        for (let i = 0; i < len; i++) {
            const scope = scopes[i];
            const langId = languages[scope];
            result[scope] = getEncodedLanguageId(langId);
        }
        return result;
    }
}
