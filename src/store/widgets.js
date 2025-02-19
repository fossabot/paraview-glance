import Vue from 'vue';

import {
  wrapMutationAsAction,
  remapIdKeys,
  remapIdList,
  getCropFilter,
} from 'paraview-glance/src/utils';

export default ({ proxyManager }) => ({
  namespaced: true,
  state: {
    measurements: {}, // dataset id -> [{component name, ...{measurement info}}]

    distanceUnitSymbol: 'mm',
    distanceUnitFactor: 1.0,

    // paint
    imageToLabelmaps: {}, // image id -> [labelmap ids]
    labelmapStates: {}, // labelmap id -> { selectedLabel, lastColorIndex }

    // crop
    croppingStates: {}, // dataset id -> cropping state
  },
  mutations: {
    setDistanceUnitSymbol(state, symbol) {
      state.distanceUnitSymbol = symbol;
    },
    setDistanceUnitFactor(state, factor) {
      state.distanceUnitFactor = factor;
    },
    addLabelmapToImage(state, { imageId, labelmapId }) {
      if (!(imageId in state.imageToLabelmaps)) {
        Vue.set(state.imageToLabelmaps, imageId, []);
      }
      state.imageToLabelmaps[imageId].push(labelmapId);
    },
    setLabelmapState(state, { labelmapId, labelmapState }) {
      Vue.set(state.labelmapStates, labelmapId, labelmapState);
    },
    addMeasurementTool(state, { datasetId, componentName, data }) {
      if (!(datasetId in state.measurements)) {
        Vue.set(state.measurements, datasetId, []);
      }
      state.measurements[datasetId].push({
        componentName,
        data,
      });
    },
    updateMeasurementTool(state, { datasetId, index, data }) {
      if (datasetId in state.measurements) {
        Vue.set(state.measurements[datasetId][index], 'data', data);
      }
    },
    removeMeasurementTool(state, { datasetId, index }) {
      if (datasetId in state.measurements) {
        state.measurements[datasetId].splice(index, 1);
      }
    },
    setCroppingState(state, { datasetId, planes }) {
      state.croppingStates[datasetId] = Array.from(planes);
    },
    rewriteProxyIds(state, { sources: idMapping }) {
      state.measurements = remapIdKeys(state.measurements, idMapping);
      state.imageToLabelmaps = remapIdKeys(state.imageToLabelmaps, idMapping);
      state.labelmapStates = remapIdKeys(state.labelmapStates, idMapping);
      state.croppingStates = remapIdKeys(state.croppingStates, idMapping);

      Object.keys(state.imageToLabelmaps).forEach((id) => {
        state.imageToLabelmaps[id] = remapIdList(
          state.imageToLabelmaps[id],
          idMapping
        );
      });
    },
  },
  actions: {
    addLabelmapToImage: wrapMutationAsAction('addLabelmapToImage'),
    setLabelmapState: wrapMutationAsAction('setLabelmapState'),
    addMeasurementTool: wrapMutationAsAction('addMeasurementTool'),
    removeMeasurementTool: wrapMutationAsAction('removeMeasurementTool'),
    updateMeasurementTool: wrapMutationAsAction('updateMeasurementTool'),
    setCroppingState: wrapMutationAsAction('setCroppingState'),
    setDistanceUnitSymbol: wrapMutationAsAction('setDistanceUnitSymbol'),
    setDistanceUnitFactor: wrapMutationAsAction('setDistanceUnitFactor'),
    rewriteProxyIds: wrapMutationAsAction('rewriteProxyIds'),
    pxmProxyCreated: {
      root: true,
      handler({ state }, { proxy, proxyId }) {
        if (proxyId in state.croppingStates) {
          const planes = state.croppingStates[proxyId];
          const filter = getCropFilter(proxyManager, proxy);
          if (filter) {
            filter.setCroppingPlanes(planes);
          }
        }
      },
    },
  },
});
