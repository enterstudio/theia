/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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

import { interfaces, Container } from 'inversify';
import { TreeWidget, TreeProps, defaultTreeProps } from './tree-widget';
import { TreeModelImpl, TreeModel } from './tree-model';
import { TreeImpl, Tree } from './tree';
import { TreeSelectionService } from './tree-selection';
import { TreeSelectionServiceImpl } from './tree-selection-impl';
import { TreeExpansionService, TreeExpansionServiceImpl } from './tree-expansion';
import { TreeNavigationService } from './tree-navigation';
import { TreeDecoratorService, NoopTreeDecoratorService } from './tree-decorator';

export function createTreeContainer(parent: interfaces.Container): Container {
    const child = new Container({ defaultScope: 'Singleton' });
    child.parent = parent;

    child.bind(TreeImpl).toSelf();
    child.bind(Tree).toDynamicValue(ctx => ctx.container.get(TreeImpl));

    child.bind(TreeSelectionServiceImpl).toSelf();
    child.bind(TreeSelectionService).toDynamicValue(ctx => ctx.container.get(TreeSelectionServiceImpl));

    child.bind(TreeExpansionServiceImpl).toSelf();
    child.bind(TreeExpansionService).toDynamicValue(ctx => ctx.container.get(TreeExpansionServiceImpl));

    child.bind(TreeNavigationService).toSelf();

    child.bind(TreeModelImpl).toSelf();
    child.bind(TreeModel).toDynamicValue(ctx => ctx.container.get(TreeModelImpl));

    child.bind(TreeWidget).toSelf();
    child.bind(TreeProps).toConstantValue(defaultTreeProps);

    child.bind(TreeDecoratorService).to(NoopTreeDecoratorService).inSingletonScope();
    return child;
}
