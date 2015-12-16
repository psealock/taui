import {handleActions} from 'redux-actions'

import config from '../config'

const initialMapMarker = {
  originMarker: {
    isDragging: false,
    position: config.map.center,
    text: ''
  },
  destinationMarker: null
}

const mapMarkerReducers = handleActions({
  UPDATE_MAP_MARKER: (state, action) => {
    return Object.assign(state, action.payload)
  }
}, initialMapMarker)

export default mapMarkerReducers
