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

package org.finos.waltz.jobs.harness;

import org.finos.waltz.model.bulk_upload.BulkUploadMode;
import org.finos.waltz.model.bulk_upload.legal_entity_relationship.BulkUploadLegalEntityRelationshipCommand;
import org.finos.waltz.model.bulk_upload.legal_entity_relationship.ImmutableBulkUploadLegalEntityRelationshipCommand;
import org.finos.waltz.model.bulk_upload.legal_entity_relationship.ResolveBulkUploadLegalEntityRelationshipParameters;
import org.finos.waltz.service.DIConfiguration;
import org.finos.waltz.service.bulk_upload.BulkUploadLegalEntityRelationshipService;
import org.jooq.DSLContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;


public class LegalEntityHarness {

    public static void main(String[] args) throws InterruptedException {

        AnnotationConfigApplicationContext ctx = new AnnotationConfigApplicationContext(DIConfiguration.class);
        DSLContext dsl = ctx.getBean(DSLContext.class);
        BulkUploadLegalEntityRelationshipService service = ctx.getBean(BulkUploadLegalEntityRelationshipService.class);

        String header = "nar, legal entity, comment\n";
        String inputString = header + "109235-1, 1202,, CLEJ";

        BulkUploadLegalEntityRelationshipCommand uploadCommand = ImmutableBulkUploadLegalEntityRelationshipCommand.builder()
                .uploadMode(BulkUploadMode.ADD_ONLY)
                .inputString(inputString)
                .legalEntityRelationshipKindId(1L)
                .build();

        ResolveBulkUploadLegalEntityRelationshipParameters resolvedCommand = service.resolve(uploadCommand);

        System.out.println(resolvedCommand.resolvedRows().size());

    }

}
