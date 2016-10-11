
/*
 *  Waltz
 * Copyright (c) David Watkins. All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 *
 */
import {checkIsEntityRef} from '../../common/checks';


function store($http, baseApiUrl) {
    const baseUrl = `${baseApiUrl}/bookmarks`;

    const save = (bookmark) => $http.post(baseUrl, bookmark);

    const findByParent = (ref) => {
        checkIsEntityRef(ref);
        return $http
            .get(`${baseUrl}/${ref.kind}/${ref.id}`)
            .then(d => d.data);
    };

    const remove = (id) => $http.delete(`${baseUrl}/${id}`);

    return {
        save,
        findByParent,
        remove
    };

}

store.$inject = ['$http', 'BaseApiUrl'];

export default store;
