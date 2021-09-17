/*
 * Waltz - Enterprise Architecture
 * Copyright (C) 2016, 2017, 2018, 2019 Waltz open source project
 * See README.md for more information
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific
 *
 */

import {remote} from "./remote";
import {entity} from "../common/services/enums/entity";

export function mkDataTypeDecoratorStore() {

    // ONLY FOR LOGICAL FLOWS
    const findByFlowIds = (flowIds = [], kind = entity.LOGICAL_DATA_FLOW.key, force = false) => {
        return remote.fetchViewData(
            "POST",
            `api/data-type-decorator/flow-ids/kind/${kind}`,
            flowIds,
            [],
            {force})
    };

    return {
        findByFlowIds
    };
}

export const dataTypeDecoratorStore = mkDataTypeDecoratorStore();