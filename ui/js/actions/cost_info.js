import * as types from 'constants/action_types'
import lbry from 'lbry'
import lbryio from 'lbryio'
import {
  selectClaimsByUri
} from 'selectors/claims'
import {
  selectSettingsIsGenerous
} from 'selectors/settings'

export function doFetchCostInfoForUri(uri) {
  return function(dispatch, getState) {
    const state = getState(),
          claim = selectClaimsByUri(state)[uri],
          isGenerous = selectSettingsIsGenerous(state)

    //
    // function getCostGenerous(uri) {
    //   console.log('get cost generous: ' + uri)
    //   // If generous is on, the calculation is simple enough that we might as well do it here in the front end
    //   lbry.resolve({uri: uri}).then((resolutionInfo) => {
    //     console.log('resolve inside getCostGenerous ' + uri)
    //     console.log(resolutionInfo)
    //     if (!resolutionInfo) {
    //       return reject(new Error("Unused URI"));
    //     }

    //   });
    // }

    function begin() {
      dispatch({
        type: types.FETCH_COST_INFO_STARTED,
        data: {
          uri,
        }
      })
    }

    function resolve(costInfo) {
      dispatch({
        type: types.FETCH_COST_INFO_COMPLETED,
        data: {
          uri,
          costInfo,
        }
      })
    }

    if (isGenerous && claim) {
      let cost
      const fee = claim.value.stream.metadata.fee;
      if (fee === undefined ) {
        resolve({ cost: 0, includesData: true })
      } else if (fee.currency == 'LBC') {
        resolve({ cost: fee.amount, includesData: true })
      } else {
        begin()
        lbryio.getExchangeRates().then(({lbc_usd}) => {
          resolve({ cost: fee.amount / lbc_usd, includesData: true })
        });
      }
    } else {
      begin()
      lbry.getCostInfo(uri).then(resolve)
    }
  }
}

