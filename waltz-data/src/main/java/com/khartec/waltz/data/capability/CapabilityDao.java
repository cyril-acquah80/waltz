/*
 *  This file is part of Waltz.
 *
 *     Waltz is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     Waltz is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with Waltz.  If not, see <http://www.gnu.org/licenses/>.
 */

package com.khartec.waltz.data.capability;

import com.khartec.waltz.model.capability.Capability;
import com.khartec.waltz.model.capability.ImmutableCapability;
import com.khartec.waltz.schema.tables.records.CapabilityRecord;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.RecordMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.khartec.waltz.model.utils.IdUtilities.ensureHasId;
import static com.khartec.waltz.schema.tables.AppCapability.APP_CAPABILITY;
import static com.khartec.waltz.schema.tables.Capability.CAPABILITY;


@Repository
public class CapabilityDao {

    private static final Logger LOG = LoggerFactory.getLogger(CapabilityDao.class);


    public static final RecordMapper<Record, Capability> capabilityMapper = r -> {
        CapabilityRecord record = r.into(CapabilityRecord.class);
        return ImmutableCapability.builder()
                .id(record.getId())
                .level(record.getLevel())
                .level1(Optional.ofNullable(record.getLevel_1()))
                .level2(Optional.ofNullable(record.getLevel_2()))
                .level3(Optional.ofNullable(record.getLevel_3()))
                .level4(Optional.ofNullable(record.getLevel_4()))
                .level5(Optional.ofNullable(record.getLevel_5()))
                .parentId(Optional.ofNullable(record.getParentId()))
                .description(record.getDescription())
                .name(record.getName())
                .build();
    };


    private final DSLContext dsl;


    @Autowired
    public CapabilityDao(DSLContext dsl) {
        this.dsl = dsl;
    }


    public List<Capability> findAll() {
        return dsl
                .select()
                .from(CAPABILITY)
                .fetch(capabilityMapper);
    }


    public void assignLevels(Map<Long, Integer> levels) {
        for (Map.Entry<Long, Integer> entry : levels.entrySet()) {
            assignLevel(entry.getKey(), entry.getValue());
        }
    }


    private void assignLevel(long capabilityId, int level) {
        dsl.update(CAPABILITY)
                .set(CAPABILITY.LEVEL, level)
                .where(CAPABILITY.ID.eq(capabilityId))
                .execute();
    }


    public List<Capability> findByIds(Long[] ids) {
        return dsl.select()
                .from(CAPABILITY)
                .where(CAPABILITY.ID.in(ids))
                .fetch(capabilityMapper);
    }


    public List<Capability> findByAppIds(Long[] appIds) {
        return dsl.select(CAPABILITY.fields())
                .from(CAPABILITY)
                .innerJoin(APP_CAPABILITY)
                .on(APP_CAPABILITY.CAPABILITY_ID.eq(CAPABILITY.ID))
                .where(APP_CAPABILITY.APPLICATION_ID.in(appIds))
                .fetch(capabilityMapper);
    }


    public boolean update(Capability capability) {
        ensureHasId(capability, "Cannot update capability record with no ID");

        return dsl.update(CAPABILITY)
                .set(CAPABILITY.NAME, capability.name())
                .set(CAPABILITY.DESCRIPTION, capability.description())
                .set(CAPABILITY.PARENT_ID, capability.parentId().orElse(null))
                .set(CAPABILITY.LEVEL, capability.level())
                .set(CAPABILITY.LEVEL_1, capability.level1().orElse(null))
                .set(CAPABILITY.LEVEL_2, capability.level2().orElse(null))
                .set(CAPABILITY.LEVEL_3, capability.level3().orElse(null))
                .set(CAPABILITY.LEVEL_4, capability.level4().orElse(null))
                .set(CAPABILITY.LEVEL_5, capability.level5().orElse(null))
                .where(CAPABILITY.ID.eq(capability.id().get()))
                .execute() == 1;

    }
}
