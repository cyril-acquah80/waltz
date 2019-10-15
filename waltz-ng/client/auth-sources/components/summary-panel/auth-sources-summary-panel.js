/*
 * Waltz - Enterprise Architecture
 * Copyright (C) 2016, 2017 Waltz open source project
 * See README.md for more information
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import _ from "lodash";
import {initialiseData} from "../../../common/index";
import template from "./auth-sources-summary-panel.html";
import {CORE_API} from "../../../common/services/core-api-utils";
import {arc, pie} from "d3-shape";
import {select} from "d3-selection";
import {authoritativeRatingColorScale} from "../../../common/colors";
import {mkApplicationSelectionOptions} from "../../../common/selector-utils";
import {reduceToSelectedNodesOnly} from "../../../common/hierarchy-utils";

const bindings = {
    filters: "<",
    parentEntityRef: "<"
};


const initialState = {
    rowInfo: _.map(
        ["PRIMARY", "SECONDARY", "DISCOURAGED", "NO_OPINION"],
        r => ({
            rating: r,
            style: {
                "border-radius": "2px",
                "border-color": authoritativeRatingColorScale(r).toString(),
                "background-color": authoritativeRatingColorScale(r).brighter(2).toString()
            }
        })),
    visibility: {
        chart: false
    }
};


const h = 130;
const w = 60;

const inboundOptions = {
    selector: "#wassp-inbound",
    transform: `translate(${w}, ${h / 2})`,
    startAngle: Math.PI,
    endAngle: 2 * Math.PI
};


const outboundOptions = {
    selector: "#wassp-outbound",
    transform: `translate(0, ${h / 2})`,
    startAngle: Math.PI,
    endAngle: 0
};

const baseStats = {
    PRIMARY: 0,
    SECONDARY: 0,
    DISCOURAGED: 0,
    NO_OPINION: 0
};


function toStats(data = []) {
    const stats = Object.assign({}, baseStats);
    return _.reduce(data, (acc, d) => {
        acc[d.rating] = acc[d.rating] += d.count;
        return acc;
    }, stats);
}


function controller($q, serviceBroker) {
    const vm = initialiseData(this, initialState);

    const drawPie = (rawStats, options) => {
        // remove any previous elements
        select(options.selector).selectAll("*").remove();
        // select(options.selector).remove();

        const svg = select(options.selector)
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        const g = svg.append("g")
            .attr("transform", options.transform);

        const isEmpty = _.sum(_.values(rawStats)) === 0;

        if (isEmpty) {
        } else {
            const pieStats = _.map(rawStats, (value, key) => ({value, key}));

            const pieData = pie()
                .value(d => d.value)
                .startAngle(options.startAngle)
                .endAngle(options.endAngle)
                (pieStats);

            const pieArc = arc()
                .outerRadius(w - 10)
                .innerRadius(w * 0.4)
                .padAngle(0.07)
                .cornerRadius(0);

            g.selectAll(".arc")
                .data(pieData)
                .enter()
                .append("path")
                .classed("arc", true)
                .attr("fill", d => authoritativeRatingColorScale(d.data.key).brighter())
                .attr("stroke", d => authoritativeRatingColorScale(d.data.key))
                .attr("d", d => pieArc(d));
        }
    };
    const determineIfChartShouldBeVisible = (inboundStats, outboundStats) => {
        const inCount = _.sum(_.values(inboundStats));
        const outCount = _.sum(_.values(outboundStats));
        return (inCount + outCount) > 0;
    };

    const calculateOverallPercentage = (inboundStats, outboundStats) => {
        const sumOfPrimaryAndSecondaryValues = (map) => {
            return safeGetNumber(map, "PRIMARY") + safeGetNumber(map, "SECONDARY");
        };

        const sumOfDiscouragedAndNoOpinionValues = (map) => {
            return safeGetNumber(map, "DISCOURAGED") + safeGetNumber(map, "NO_OPINION");
        };

        const safeGetNumber = (map, key) => {
            const value = map[key];
            return _.isNumber(value) && !_.isNaN(value) ? value : 0;
        };

        const sumRasNonRas = sumOfPrimaryAndSecondaryValues(inboundStats)
            + sumOfPrimaryAndSecondaryValues(outboundStats);

        const sumOfAll = sumRasNonRas
            + sumOfDiscouragedAndNoOpinionValues(inboundStats)
            + sumOfDiscouragedAndNoOpinionValues(outboundStats);

        const overallPercentage = sumOfAll !== 0 ? sumRasNonRas / sumOfAll * 100 : 0;
        return Number(overallPercentage).toFixed(2);
    };

    const loadSummaryStats = (parentEntityRef, filters, selectedItems=[]) => {
        if (parentEntityRef) {
            const inboundPromise = serviceBroker
                .loadViewData(
                    CORE_API.LogicalFlowDecoratorStore.summarizeInboundBySelector,
                    [mkApplicationSelectionOptions(
                        parentEntityRef,
                        undefined,
                        undefined,
                        filters)]);
            const outboundPromise = serviceBroker
                .loadViewData(
                    CORE_API.LogicalFlowDecoratorStore.summarizeOutboundBySelector,
                    [mkApplicationSelectionOptions(
                        parentEntityRef,
                        undefined,
                        undefined,
                        filters)]);
            $q.all([inboundPromise, outboundPromise])
                .then(xs => xs.map(r => r.data))
                .then(xs => {
                    //in case user has chosen to selectively plot only some items then we feed them into display separately
                    let filteredDataTypes = xs.map(r => {
                        if (selectedItems && selectedItems.length){
                            const reduceable = [...r].map(e => Object.assign({e}, {id :e.decoratorEntityReference.id}));
                            const reduced = reduceToSelectedNodesOnly(reduceable, selectedItems).map(e => e.id);
                            return r.filter(e => reduced.includes(e.decoratorEntityReference.id))
                        }
                        else {
                            return r;
                        }
                    });
                    const [inboundStats, outboundStats] = filteredDataTypes.map(r => toStats(r));
                    drawPie(inboundStats, inboundOptions);
                    drawPie(outboundStats, outboundOptions);
                    vm.overallPercentageOfAuthoritiveSources = calculateOverallPercentage(inboundStats, outboundStats);
                    vm.visibility.chart = determineIfChartShouldBeVisible(inboundStats, outboundStats);
                    vm.inboundStats = inboundStats;
                    vm.outboundStats = outboundStats;
                    return xs;
                }).then(xs => {
                    const [inboundDataTypes, outboundDataTypes] = xs;
                    const extractDtIdsFn = (myDataTypes) => myDataTypes.map(e => e.decoratorEntityReference.id);
                    const displayDataTypeIds = extractDtIdsFn(inboundDataTypes).concat(extractDtIdsFn(outboundDataTypes));

                    return serviceBroker
                        .loadAppData(CORE_API.DataTypeStore.findAll)
                        .then(result => result.data)
                        .then(dataTypes => dataTypes.map(e => Object.assign(e, {concrete: displayDataTypeIds.includes(e.id)})))
                        .then(dataTypes => reduceToSelectedNodesOnly(dataTypes, displayDataTypeIds));
                }).then(applicableDataTypes => {
                    vm.dataTypes = applicableDataTypes
                });
        }
    };
    vm.onTreeFilterChange = (selectedItems) => {
        loadSummaryStats(vm.parentEntityRef, vm.filters, selectedItems);
    };
    vm.$onInit = () => {
        loadSummaryStats(vm.parentEntityRef, vm.filters);
    };

    vm.$onChanges = (changes) => {
        if (changes.filters) {
            loadSummaryStats(vm.parentEntityRef, vm.filters);
        }
    };
}


controller.$inject = [
    "$q",
    "ServiceBroker"
];


export const component = {
    bindings,
    template,
    controller
};


export const id = "waltzAuthSourcesSummaryPanel";
