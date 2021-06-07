import _ from "lodash";
import {sameRef} from "../../../../common/entity-utils";
import {toGraphId} from "../../../flow-diagram-utils";


export function prepareUpdateCommands(flows = [],
                                      existingEntities = [],
                                      isUpstream,
                                      baseEntity) {

    const additions = _.filter(flows, f => ! f.existing && f.used);
    const removals = _.filter(flows, f => f.existing && ! f.used);

    const nodeAdditionCommands = _
        .chain(additions)
        .reject(f => _.some(existingEntities, ent => sameRef(ent, f.counterpartEntity)))
        .flatMap(f => {
            const addCmd = {
                command: 'ADD_NODE',
                payload: f.counterpartEntity
            };
            const dx = _.random(-80, 80);
            const dy = _.random(50, 80) * (isUpstream ? -1 : 1);

            const moveCmd = {
                command: 'MOVE',
                payload: {
                    id: toGraphId(f.counterpartEntity),
                    refId: toGraphId(baseEntity),
                    dx,
                    dy
                }
            };
            return [addCmd, moveCmd];
        })
        .value();

    const flowAdditionCommands = _.map(additions, f => {
        return {
            command: 'ADD_FLOW',
            payload: f.logicalFlow
        };
    });

    const flowRemovalCommands = _.map(removals, f => {
        return {
            command: 'REMOVE_FLOW',
            payload: {
                id: toGraphId(f.logicalFlow),
                source: toGraphId(f.logicalFlow.source),
                target: toGraphId(f.logicalFlow.target)
            }
        };
    });

    return _.concat(nodeAdditionCommands, flowAdditionCommands, flowRemovalCommands);
}



export function mkFlows(logicalFlows = [], node, isUpstream, existingEntities = []) {
    const counterpartPropName = isUpstream
        ? 'source'
        : 'target';

    const selfPropName = isUpstream
        ? 'target'
        : 'source';

    return _
        .chain(logicalFlows)
        .filter(f => f[selfPropName].id === node.id)
        .reject(f => f[counterpartPropName].id === node.id)
        .map(f => Object.assign({}, f, { kind: 'LOGICAL_DATA_FLOW' }))
        .map(f => {
            const counterpartEntity = f[counterpartPropName];
            const flowExists = _.some(existingEntities, ref => sameRef(ref, counterpartEntity));
            return {
                counterpartEntity,
                logicalFlow: f,
                used: flowExists,
                existing: flowExists
            };
        })
        .sortBy(d => d.counterpartEntity.name.toLowerCase())
        .value();
}


export function preparePhysicalFlowUpdates(flows) {
    const additions = _.filter(flows, f => ! f.existing && f.used);
    const removals = _.filter(flows, f => f.existing && ! f.used);

    const additionCommands = _.map(additions, f => {
        return {
            command: 'ADD_DECORATION',
            payload: {
                ref: {
                    id: f.physicalFlow.logicalFlowId,
                    kind: 'LOGICAL_DATA_FLOW'
                },
                decoration: {
                    id: f.physicalFlow.id,
                    kind: 'PHYSICAL_FLOW'
                }
            }
        };
    });

    const removalCommands = _.map(removals, f => {
        return {
            command: 'REMOVE_DECORATION',
            payload: {
                ref: {
                    id: f.physicalFlow.logicalFlowId,
                    kind: 'LOGICAL_DATA_FLOW'
                },
                decoration: {
                    id: f.physicalFlow.id,
                    kind: 'PHYSICAL_FLOW'
                }
            }
        };
    });

    return _.concat(additionCommands, removalCommands)
}


export function preparePhysicalFlows(
    physicalFlows = [],
    physicalSpecifications = [],
    existingEntities = [])
{
    const specsById = _.keyBy(physicalSpecifications, 'id');
    return _.chain(physicalFlows)
        .map(f => {
            const currentlyUsed = _.some(existingEntities, existing => sameRef(existing, { kind: 'PHYSICAL_FLOW', id: f.id }))
            return {
                used: currentlyUsed,
                existing: currentlyUsed,
                physicalFlow: f,
                specification: specsById[f.specificationId]
            };
        })
        .filter(f => !_.isNil(f.specification))
        .sortBy(d => d.specification.name.toLowerCase())
        .value();
}
