package com.khartec.waltz.data.orgunit.search;

import com.khartec.waltz.data.DatabaseVendorSpecific;
import com.khartec.waltz.data.FullTextSearch;
import com.khartec.waltz.data.JooqUtilities;
import com.khartec.waltz.data.orgunit.OrganisationalUnitDao;
import com.khartec.waltz.model.orgunit.OrganisationalUnit;
import org.jooq.DSLContext;

import java.util.List;

import static com.khartec.waltz.schema.tables.OrganisationalUnit.ORGANISATIONAL_UNIT;

public class SqlServerOrganisationalUnitSearch implements FullTextSearch<OrganisationalUnit>, DatabaseVendorSpecific {

    @Override
    public List<OrganisationalUnit> search(DSLContext dsl, String terms) {
        return dsl.select(ORGANISATIONAL_UNIT.fields())
                .from(ORGANISATIONAL_UNIT)
                .where(JooqUtilities.MSSQL.mkContains(terms.split(" ")))
                .limit(20)
                .fetch(OrganisationalUnitDao.recordMapper);
    }
}
